cmake_minimum_required(VERSION 3.24)

include(pico_sdk_import.cmake)

project(rp2350_multifunction_instrument C CXX ASM)

pico_sdk_init()

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

add_executable(instrument
    src/main.c
    src/system_init.c
    src/acquisition.c
    src/generation.c
    src/control.c
    src/ui_main.c)

pico_generate_pio_header(instrument ${CMAKE_CURRENT_SOURCE_DIR}/hardware/pio/adc_capture.pio)
pico_generate_pio_header(instrument ${CMAKE_CURRENT_SOURCE_DIR}/hardware/pio/dds_output.pio)

pico_add_extra_outputs(instrument)

target_include_directories(instrument PRIVATE include)

# Link with Pico SDK components and LVGL (assumed to be added as an external library)
target_link_libraries(instrument
    pico_stdlib
    hardware_dma
    hardware_pio
    hardware_pwm
    hardware_irq
    hardware_clocks
    pico_multicore
    lvgl)

# Display driver pins require stdio over USB for debugging
pico_enable_stdio_usb(instrument 1)
pico_enable_stdio_uart(instrument 0)
