#include "generation.h"

#include <math.h>
#include <string.h>

#include "pico/stdlib.h"
#include "hardware/clocks.h"
#include "hardware/dma.h"
#include "hardware/pio.h"
#include "hardware/pwm.h"
#include "hardware/irq.h"

#include "hw_config.h"
#include "dds_output.pio.h"

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

static PIO dds_pio = pio1;
static uint dds_sm = 0;
static int dma_channel_dds = DMA_DAC_CHANNEL_A;
static int dds_program_offset = -1;

static generation_config_t current_config;
static uint16_t waveform_table[WAVEFORM_TABLE_LENGTH];
static void configure_dds(const generation_config_t *config);
static void configure_pwm(const generation_config_t *config);
static void configure_dc(const generation_config_t *config);

void generation_init(void) {
    memset(&current_config, 0, sizeof(current_config));
    current_config.mode = GENERATION_MODE_DDS;
    current_config.frequency_hz = 1000.0f;
    current_config.amplitude_vpp = 2.0f;
    current_config.offset_v = 0.0f;
    current_config.duty_cycle = 0.5f;

    for (size_t i = 0; i < WAVEFORM_TABLE_LENGTH; ++i) {
        float phase = (2.0f * (float)M_PI * (float)i) / (float)WAVEFORM_TABLE_LENGTH;
        waveform_table[i] = (uint16_t)(((sinf(phase) * 0.5f + 0.5f) * 4095.0f)) << 4;
    }

    dma_channel_claim(dma_channel_dds);
    pio_sm_set_consecutive_pindirs(dds_pio, dds_sm, PIN_DAC_D0, 12, true);
}

void generation_apply_config(const generation_config_t *config) {
    current_config = *config;

    switch (current_config.mode) {
        case GENERATION_MODE_DDS:
        case GENERATION_MODE_ARB:
            configure_dds(config);
            break;
        case GENERATION_MODE_PWM:
            configure_pwm(config);
            break;
        case GENERATION_MODE_DC:
            configure_dc(config);
            break;
    }
}

void generation_start(void) {
    switch (current_config.mode) {
        case GENERATION_MODE_DDS:
        case GENERATION_MODE_ARB:
            dma_channel_start(dma_channel_dds);
            pio_sm_set_enabled(dds_pio, dds_sm, true);
            break;
        case GENERATION_MODE_PWM:
            pwm_set_enabled(pwm_gpio_to_slice_num(PIN_PWM_OUT), true);
            break;
        case GENERATION_MODE_DC:
            gpio_put(PIN_DC_OUT, true);
            break;
    }
}

void generation_stop(void) {
    switch (current_config.mode) {
        case GENERATION_MODE_DDS:
        case GENERATION_MODE_ARB:
            pio_sm_set_enabled(dds_pio, dds_sm, false);
            dma_channel_abort(dma_channel_dds);
            break;
        case GENERATION_MODE_PWM:
            pwm_set_enabled(pwm_gpio_to_slice_num(PIN_PWM_OUT), false);
            break;
        case GENERATION_MODE_DC:
            gpio_put(PIN_DC_OUT, false);
            break;
    }
}

static void configure_dds(const generation_config_t *config) {
    float target_sample_rate = config->frequency_hz * (float)WAVEFORM_TABLE_LENGTH;
    if (target_sample_rate <= 0.0f) {
        target_sample_rate = (float)DDS_SAMPLE_RATE_HZ;
    }
    if (target_sample_rate > (float)DDS_SAMPLE_RATE_HZ) {
        target_sample_rate = (float)DDS_SAMPLE_RATE_HZ;
    }

    if (dds_program_offset < 0) {
        dds_program_offset = pio_add_program(dds_pio, &dds_output_program);
    }
    dds_output_program_init(dds_pio, dds_sm, dds_program_offset, PIN_DAC_D0, target_sample_rate);

    if (config->mode == GENERATION_MODE_DDS) {
        for (size_t i = 0; i < WAVEFORM_TABLE_LENGTH; ++i) {
            float phase = (2.0f * (float)M_PI * (float)i) / (float)WAVEFORM_TABLE_LENGTH;
            waveform_table[i] = (uint16_t)(((sinf(phase) * 0.5f + 0.5f) * 4095.0f)) << 4;
        }
    } else if (config->arb_waveform && config->arb_length) {
        size_t copy = config->arb_length < WAVEFORM_TABLE_LENGTH ? config->arb_length : WAVEFORM_TABLE_LENGTH;
        for (size_t i = 0; i < copy; ++i) {
            waveform_table[i] = (uint16_t)(config->arb_waveform[i] << 4);
        }
        if (copy < WAVEFORM_TABLE_LENGTH) {
            memset(&waveform_table[copy], 0, (WAVEFORM_TABLE_LENGTH - copy) * sizeof(uint16_t));
        }
    }

    dma_channel_config c = dma_channel_get_default_config(dma_channel_dds);
    channel_config_set_read_increment(&c, true);
    channel_config_set_write_increment(&c, false);
    channel_config_set_dreq(&c, pio_get_dreq(dds_pio, dds_sm, true));
    channel_config_set_transfer_data_size(&c, DMA_SIZE_16);
    channel_config_set_ring(&c, true, 12); // 2^12 = 4096 entries

    dma_channel_configure(
        dma_channel_dds,
        &c,
        &dds_pio->txf[dds_sm],
        waveform_table,
        WAVEFORM_TABLE_LENGTH,
        false);

}

static void configure_pwm(const generation_config_t *config) {
    gpio_set_function(PIN_PWM_OUT, GPIO_FUNC_PWM);
    uint slice = pwm_gpio_to_slice_num(PIN_PWM_OUT);

    uint32_t sys_clk = clock_get_hz(clk_sys);
    uint32_t target_freq = (uint32_t)config->frequency_hz;
    if (target_freq == 0) {
        target_freq = 1;
    }
    uint32_t wrap = sys_clk / target_freq;
    if (wrap == 0) {
        wrap = 1;
    }
    pwm_config pwm_cfg = pwm_get_default_config();
    pwm_config_set_wrap(&pwm_cfg, wrap - 1);
    pwm_init(slice, &pwm_cfg, false);

    uint32_t level = (uint32_t)((config->duty_cycle < 0.0f ? 0.0f : config->duty_cycle > 1.0f ? 1.0f : config->duty_cycle) * (wrap - 1));
    pwm_set_chan_level(slice, pwm_gpio_to_channel(PIN_PWM_OUT), level);
}

static void configure_dc(const generation_config_t *config) {
    gpio_init(PIN_DC_OUT);
    gpio_set_dir(PIN_DC_OUT, GPIO_OUT);
    gpio_put(PIN_DC_OUT, config->offset_v > 0.0f);
}

