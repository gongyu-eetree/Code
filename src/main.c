#include <math.h>

#include "pico/stdlib.h"
#include "pico/multicore.h"
#include "system_init.h"
#include "control.h"
#include "acquisition.h"
#include "generation.h"
#include "ui_main.h"

static void core1_entry(void);

int main(void) {
    stdio_init_all();

    if (!system_init()) {
        while (true) {
            tight_loop_contents();
        }
    }

    multicore_launch_core1(core1_entry);

    while (true) {
        system_tasks();
        tight_loop_contents();
    }
}

static void core1_entry(void) {
    while (true) {
        acquisition_buffer_t buffer;
        if (acquisition_fetch_buffer(&buffer)) {
            float sum_sq_a = 0.0f;
            float sum_sq_b = 0.0f;
            for (size_t i = 0; i < buffer.length; ++i) {
                float sample_a = (float)buffer.channel_a[i];
                sum_sq_a += sample_a * sample_a;
                if (buffer.channel_b) {
                    float sample_b = (float)buffer.channel_b[i];
                    sum_sq_b += sample_b * sample_b;
                }
            }

            float vrms_a = sqrtf(sum_sq_a / (float)buffer.length);
            float vrms_b = buffer.channel_b ? sqrtf(sum_sq_b / (float)buffer.length) : 0.0f;
            control_publish_measurement(vrms_a, vrms_b, 0.0f);
            acquisition_release_buffer(&buffer);
        } else {
            __wfe();
        }
    }
}
