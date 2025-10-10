#include "system_init.h"

#include "pico/stdlib.h"
#include "pico/multicore.h"
#include "hardware/clocks.h"
#include "hardware/gpio.h"
#include "hardware/irq.h"
#include "hardware/regs/intctrl.h"
#include "lvgl.h"

#include "hw_config.h"
#include "acquisition.h"
#include "generation.h"
#include "control.h"
#include "ui_main.h"

static bool clocks_configured = false;

static void init_gpio_defaults(void) {
    const uint gpio_list[] = {
        PIN_ADC_A0, PIN_ADC_A1, PIN_ADC_A2, PIN_ADC_A3,
        PIN_ADC_A4, PIN_ADC_A5, PIN_ADC_A6, PIN_ADC_A7,
        PIN_ADC_B0, PIN_ADC_B1, PIN_ADC_B2, PIN_ADC_B3,
        PIN_ADC_B4, PIN_ADC_B5, PIN_ADC_B6, PIN_ADC_B7,
        PIN_ADC_CLK, PIN_ADC_SYNC,
        PIN_DAC_D0, PIN_DAC_D1, PIN_DAC_D2, PIN_DAC_D3,
        PIN_DAC_D4, PIN_DAC_D5, PIN_DAC_D6, PIN_DAC_D7,
        PIN_DAC_D8, PIN_DAC_D9, PIN_DAC_D10, PIN_DAC_D11,
        PIN_PWM_OUT, PIN_DC_OUT,
        PIN_LCD_SCLK, PIN_LCD_MOSI, PIN_LCD_RST, PIN_LCD_DC,
        PIN_LCD_BL, PIN_LCD_CS,
        PIN_KEY_PA, PIN_KEY_PB, PIN_KEY_PC, PIN_KEY_PD
    };

    for (size_t i = 0; i < sizeof(gpio_list) / sizeof(gpio_list[0]); ++i) {
        gpio_init(gpio_list[i]);
        gpio_set_dir(gpio_list[i], GPIO_IN);
        gpio_disable_pulls(gpio_list[i]);
    }
}

bool system_init(void) {
    if (!clocks_configured) {
        set_sys_clock_khz(250000, true);
        clocks_configured = true;
    }

    init_gpio_defaults();

    lv_init();

    acquisition_init();
    generation_init();
    control_init();
    ui_init();
    ui_on_config_changed(control_get_config());

    return true;
}

void system_tasks(void) {
    lv_timer_handler();
    control_process();
}
