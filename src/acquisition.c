#include "acquisition.h"

#include <string.h>

#include "pico/stdlib.h"
#include "hardware/dma.h"
#include "hardware/irq.h"
#include "hardware/pio.h"
#include "hardware/clocks.h"
#include "hardware/regs/intctrl.h"
#include "pico/sync.h"
#include "pico/time.h"

#include "hw_config.h"

#include "adc_capture.pio.h"

static PIO adc_pio = pio0;
static uint adc_sm_a = 0;
static uint adc_sm_b = 1;
static int adc_program_offset = -1;

static acquisition_config_t current_config;
static critical_section_t buffer_lock;

static uint16_t buffer_memory[2][2][SAMPLE_BUFFER_LENGTH];
static volatile bool buffer_ready[2];
static volatile uint64_t buffer_timestamp[2];
static volatile uint buffer_write_index = 0;

static int current_dma_channel_a = DMA_ADC_CHANNEL_A;
static int current_dma_channel_b = DMA_ADC_CHANNEL_B;

static void configure_pio(const acquisition_config_t *config);
static void configure_dma(const acquisition_config_t *config);
static void __isr dma_handler(void);

void acquisition_init(void) {
    memset(&current_config, 0, sizeof(current_config));
    current_config.sample_rate_hz = 18000000;
    current_config.dual_channel = true;
    current_config.ddr_mode = true;
    critical_section_init(&buffer_lock);

    buffer_ready[0] = false;
    buffer_ready[1] = false;

    irq_set_exclusive_handler(DMA_IRQ_0, dma_handler);
    irq_set_enabled(DMA_IRQ_0, true);
}

void acquisition_apply_config(const acquisition_config_t *config) {
    current_config = *config;
    configure_pio(config);
    configure_dma(config);
}

void acquisition_start(void) {
    dma_channel_start(current_dma_channel_a);
    if (current_config.dual_channel) {
        dma_channel_start(current_dma_channel_b);
    }
    pio_sm_set_enabled(adc_pio, adc_sm_a, true);
    if (current_config.dual_channel) {
        pio_sm_set_enabled(adc_pio, adc_sm_b, true);
    }
}

void acquisition_stop(void) {
    pio_sm_set_enabled(adc_pio, adc_sm_a, false);
    pio_sm_set_enabled(adc_pio, adc_sm_b, false);
    dma_channel_abort(current_dma_channel_a);
    dma_channel_abort(current_dma_channel_b);
}

bool acquisition_fetch_buffer(acquisition_buffer_t *buffer) {
    bool success = false;
    critical_section_enter_blocking(&buffer_lock);
    for (size_t i = 0; i < 2; ++i) {
        if (buffer_ready[i]) {
            buffer->channel_a = buffer_memory[i][0];
            buffer->channel_b = current_config.dual_channel ? buffer_memory[i][1] : NULL;
            buffer->length = SAMPLE_BUFFER_LENGTH;
            buffer->timestamp = buffer_timestamp[i];
            buffer_ready[i] = false;
            success = true;
            break;
        }
    }
    critical_section_exit(&buffer_lock);
    return success;
}

void acquisition_release_buffer(const acquisition_buffer_t *buffer) {
    (void)buffer;
}

static void configure_pio(const acquisition_config_t *config) {
    if (adc_program_offset < 0) {
        adc_program_offset = pio_add_program(adc_pio, &adc_capture_program);
    }
    float clkdiv = (float)clock_get_hz(clk_sys) / (float)config->sample_rate_hz;
    adc_capture_program_init(adc_pio, adc_sm_a, adc_program_offset, PIN_ADC_A0, PIN_ADC_CLK, config->ddr_mode, clkdiv);
    if (config->dual_channel) {
        adc_capture_program_init(adc_pio, adc_sm_b, adc_program_offset, PIN_ADC_B0, PIN_ADC_CLK, config->ddr_mode, clkdiv);
    }
}

static void configure_dma(const acquisition_config_t *config) {
    dma_channel_config config_a = dma_channel_get_default_config(current_dma_channel_a);
    channel_config_set_read_increment(&config_a, false);
    channel_config_set_write_increment(&config_a, true);
    channel_config_set_dreq(&config_a, pio_get_dreq(adc_pio, adc_sm_a, false));
    channel_config_set_transfer_data_size(&config_a, DMA_SIZE_16);

    dma_channel_configure(
        current_dma_channel_a,
        &config_a,
        buffer_memory[0][0],
        &adc_pio->rxf[adc_sm_a],
        SAMPLE_BUFFER_LENGTH,
        false);

    if (config->dual_channel) {
        dma_channel_config config_b = dma_channel_get_default_config(current_dma_channel_b);
        channel_config_set_read_increment(&config_b, false);
        channel_config_set_write_increment(&config_b, true);
        channel_config_set_dreq(&config_b, pio_get_dreq(adc_pio, adc_sm_b, false));
        channel_config_set_transfer_data_size(&config_b, DMA_SIZE_16);

        dma_channel_configure(
            current_dma_channel_b,
            &config_b,
            buffer_memory[0][1],
            &adc_pio->rxf[adc_sm_b],
            SAMPLE_BUFFER_LENGTH,
            false);
    } else {
        dma_channel_abort(current_dma_channel_b);
    }

    dma_hw->ints0 = (1u << current_dma_channel_a) | (1u << current_dma_channel_b);
    dma_channel_set_irq0_enabled(current_dma_channel_a, true);
    dma_channel_set_irq0_enabled(current_dma_channel_b, config->dual_channel);

    buffer_write_index = 0;
    buffer_ready[0] = false;
    buffer_ready[1] = false;
    buffer_timestamp[0] = 0;
    buffer_timestamp[1] = 0;
}

static void __isr dma_handler(void) {
    uint32_t status = dma_hw->ints0;
    dma_hw->ints0 = status;

    if (status & (1u << current_dma_channel_a)) {
        uint completed_index = buffer_write_index;
        uint next_index = buffer_write_index ^ 1u;

        dma_channel_set_write_addr(current_dma_channel_a, buffer_memory[next_index][0], false);
        dma_channel_set_trans_count(current_dma_channel_a, SAMPLE_BUFFER_LENGTH, false);
        if (current_config.dual_channel) {
            dma_channel_set_write_addr(current_dma_channel_b, buffer_memory[next_index][1], false);
            dma_channel_set_trans_count(current_dma_channel_b, SAMPLE_BUFFER_LENGTH, false);
        }

        buffer_timestamp[completed_index] = time_us_64();
        critical_section_enter_blocking(&buffer_lock);
        buffer_ready[completed_index] = true;
        critical_section_exit(&buffer_lock);

        buffer_write_index = next_index;

        dma_channel_start(current_dma_channel_a);
        if (current_config.dual_channel) {
            dma_channel_start(current_dma_channel_b);
        }
    }
}
