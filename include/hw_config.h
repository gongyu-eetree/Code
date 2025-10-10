#ifndef HW_CONFIG_H
#define HW_CONFIG_H

#include <stdint.h>

// ADC (MAX1193) channel A pins
#define PIN_ADC_A0   0
#define PIN_ADC_A1   1
#define PIN_ADC_A2   2
#define PIN_ADC_A3   3
#define PIN_ADC_A4   4
#define PIN_ADC_A5   5
#define PIN_ADC_A6   6
#define PIN_ADC_A7   7

// ADC (MAX1193) channel B pins
#define PIN_ADC_B0   10
#define PIN_ADC_B1   11
#define PIN_ADC_B2   12
#define PIN_ADC_B3   13
#define PIN_ADC_B4   14
#define PIN_ADC_B5   15
#define PIN_ADC_B6   16
#define PIN_ADC_B7   17

#define PIN_ADC_CLK  8
#define PIN_ADC_SYNC 9   // ADC_A/B0/8 signal, used for framing

// DAC (12-bit, 250 Msps parallel interface)
#define PIN_DAC_D0   18
#define PIN_DAC_D1   19
#define PIN_DAC_D2   20
#define PIN_DAC_D3   21
#define PIN_DAC_D4   22
#define PIN_DAC_D5   23
#define PIN_DAC_D6   24
#define PIN_DAC_D7   25
#define PIN_DAC_D8   26
#define PIN_DAC_D9   27
#define PIN_DAC_D10  28
#define PIN_DAC_D11  29

// PWM and DC outputs
#define PIN_PWM_OUT  30
#define PIN_DC_OUT   31

// SPI LCD (ST7789)
#define PIN_LCD_SCLK 32
#define PIN_LCD_MOSI 33
#define PIN_LCD_RST  34
#define PIN_LCD_DC   35
#define PIN_LCD_BL   36
#define PIN_LCD_CS   37

// User keys
#define PIN_KEY_PA   38
#define PIN_KEY_PB   39
#define PIN_KEY_PC   40
#define PIN_KEY_PD   41

// On-board RGB LED (Pico 2)
#define PIN_LED_R    12
#define PIN_LED_G    13
#define PIN_LED_B    14

// System level constants
#define SAMPLE_BUFFER_LENGTH   (32 * 1024)
#define WAVEFORM_TABLE_LENGTH  (4096)
#define DDS_SAMPLE_RATE_HZ     (10000000U)
#define PWM_MAX_FREQUENCY_HZ   (10000000U)

// DMA channel allocation (example)
#define DMA_ADC_CHANNEL_A      0
#define DMA_ADC_CHANNEL_B      1
#define DMA_DAC_CHANNEL_A      2
#define DMA_DAC_CHANNEL_B      3

#endif // HW_CONFIG_H
