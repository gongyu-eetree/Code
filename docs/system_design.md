# RP2350B Portable Multifunction Instrument Architecture

## Overview
This document captures the proposed architecture for a dual-channel data acquisition and signal generation instrument implemented on the RP2350B microcontroller with an LVGL-based user interface. The design meets the functional requirements provided in the reference image and builds on reliable open-source examples for RP2040/RP2350 PIO, DMA, DDS, and high-speed ADC integration.

The firmware is written in C and targets the Raspberry Pi Pico 2 (RP2350B) using the official Pico SDK, LVGL 9.x, and a modular driver framework. The same structure can be adapted for other RP2350B boards.

## System Blocks

```
+--------------------------+
|        LVGL UI           |
|  (display + touch/key)   |
+------------+-------------+
             |
             v
+------------+-------------+
| Control/State Machine    |
| (core0)                  |
+------------+-------------+
             |
  +----------+-----------+
  |                      |
  v                      v
Signal Generation    Data Acquisition
(core1 optional)     (core1 optional)
  |                      |
  v                      v
DDS/PWM/DC PIO       ADC PIO capture
  |                      |
DMA ring buffers  DMA ring buffers
```

## Core Responsibilities
- **Core 0 (UI & Supervisor):** Initializes LVGL, handles the event loop, manages configuration state, schedules acquisition/generation tasks, and communicates with Core 1 through queues/fifos.
- **Core 1 (High-Speed Engine, optional):** Services tight real-time loops for ADC capture and waveform synthesis when Core 0 load becomes too high. If single-core is sufficient, the engine tasks run as LVGL timers/RTOS tasks.

## Data Flow
1. **Acquisition:** PIO state machines sample the ADC(s) (up to 45 MSa/s using DDR techniques). DMA writes samples into double-buffered ring buffers in SRAM. Core 1 signals buffer availability to Core 0, which processes data (FFT, measurements) and renders waveforms in LVGL.
2. **Generation:** Waveform tables (DDS), arbitrary waveform buffers, and PWM parameters are maintained in RAM. PIO state machines output the data to DAC/PWM pins. DMA streams buffers from memory, with double buffering for seamless playback.
3. **Control:** LVGL components update configuration structures. A dispatcher pushes updates to hardware drivers, restarts DMA, or recalculates waveforms.

## Key Modules
- `system_init`: clock setup, LVGL initialization, DMA mux, PIO program loading.
- `ui`: LVGL layout for oscilloscope/signal generator views, settings pages, and pop-ups.
- `acquisition`: ADC interface, DMA, decimation, trigger detection, data post-processing.
- `generation`: DDS, arbitrary waveform, PWM, and DC output drivers.
- `control`: state machine and message passing between UI and hardware tasks.
- `storage`: optional waveform/setting persistence (QSPI flash/SD).

## Hardware Interfaces
- **Display:** SPI display (ST7789) via SPI0 w/ DMA assisted flush. LVGL uses a display driver with full-frame or partial updates.
- **Touch/Keys:** Resistive touch or IO buttons via ADC/GPIO; scanned by LVGL input device driver.
- **ADC:** External high-speed ADC (e.g., MAX1193, AD9288). Captured via PIO using DDR sampling on GPIOs 0-7, with PIO clock from GPIO8. Optional analog multiplexer selects channel. Trigger uses GPIO9.
  > ⚠️ Pico 2 RGB LED pins (GPIO12–GPIO14) overlap with ADC_B0–ADC_B2. Gate the LED when the ADC is active or reroute LED control to spare pins during final hardware layout.
- **DAC:** Dual 12-bit DAC via SPI/I²C/SPI-parallel; arbitrary waveform buffered in DMA.
- **PWM/DC:** PIO or RP2350 PWM slices for high-resolution PWM; DC output with DAC and amplifier.
- **DDS:** Numerically controlled oscillator generating 10 MHz sample stream for single-channel arbitrary waveform output.

## Timing Considerations
- **Acquisition DMA:** Double-buffered DMA channels service each PIO state machine. Interrupts re-arm the next buffer while Core 1 processes the captured frame.
- **Generation DMA:** Circular DMA streams waveform tables to the DAC PIO, paced by the TX FIFO request line for seamless playback.
- **LVGL Tick:** SysTick/Timer alarm at 1 ms. Display flush uses DMA to avoid blocking.
- **Core Synchronization:** Pico SDK's multicore FIFO for configuration updates and status messages.

## Memory Layout (Example)
- 256 KB for frame buffers (LVGL).
- 128 KB for acquisition ring buffer (2 × 32 k samples × 2 bytes × 2 channels).
- 64 KB for waveform tables.
- Remaining for code/stack.

## Build System
- Uses CMake from Pico SDK with LVGL as a submodule or pre-built library.
- `hardware/` holds PIO programs compiled with `pioasm` during the build.
- `src/` contains C sources; `include/` contains public headers.

## Development Roadmap
1. Bring-up board support package (clocks, display, keys).
2. Implement LVGL display/input drivers and UI skeleton.
3. Integrate acquisition PIO + DMA in loopback test.
4. Add generation pipelines (DDS → PIO → output).
5. Implement control logic, trigger, measurement algorithms.
6. Optimize buffering, switch to dual-core if required.
7. Add storage and calibration procedures.

## References
- [LVGL documentation](https://docs.lvgl.io/)
- [Pico SDK PIO DMA examples](https://github.com/raspberrypi/pico-examples/tree/master/pio)
- Reference wiki links provided in the prompt for PIO, DDS, high-speed ADC, and DMA usage.
