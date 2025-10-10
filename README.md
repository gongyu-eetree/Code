# RP2350B Portable Multifunction Instrument Firmware

This repository contains a C-based firmware framework for a portable dual-channel acquisition and multifunction signal generation instrument powered by the RP2350B microcontroller (Raspberry Pi Pico 2). The project uses LVGL for the user interface and leverages RP2350B PIO and DMA peripherals for high-speed data movement.

## Features
- Dual-channel 45 MSa/s (18 MHz analog bandwidth) acquisition using an external MAX1193 ADC sampled via PIO and DMA.
- Single-channel 12-bit arbitrary waveform generation up to 10 MHz using a high-speed DAC driven from DMA/PIO.
- Single-channel PWM generation up to 10 MHz using the RP2350B PWM slices.
- Single-channel adjustable DC output (via external DAC/power stage control pin).
- LVGL-based UI with ST7789 SPI display, backlight, and button handling.
- Modular driver layers for acquisition, generation, control logic, and UI.

## Repository Layout
- `docs/system_design.md` – Architectural overview and implementation roadmap.
- `include/` – Public headers for each subsystem.
- `src/` – C source files for system initialization, acquisition, generation, control, and LVGL UI integration.
- `hardware/pio/` – PIO assembly programs for ADC capture and DAC streaming.
- `CMakeLists.txt` – Build configuration targeting the Pico SDK with LVGL linked as an external library.

## Building
1. Install the [Pico SDK](https://github.com/raspberrypi/pico-sdk) and set the `PICO_SDK_PATH` environment variable.
2. Add LVGL as a dependency (either as a pre-built library or as part of your CMake project).
3. Generate build files:
   ```bash
   mkdir build
   cd build
   cmake ..
   make
   ```
4. Flash the resulting UF2 onto the RP2350B board.

## Next Steps
- Implement LVGL display and input drivers tailored to the selected hardware.
- Complete ADC trigger logic and data processing (FFT, measurement overlays).
- Finalize waveform editing tools in the UI and add storage for presets.
- Calibrate analog front-end gains/offsets and integrate protection circuitry monitoring.
