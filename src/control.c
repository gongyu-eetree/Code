#include "control.h"

#include <string.h>

#include "pico/stdlib.h"
#include "pico/util/queue.h"

#include "acquisition.h"
#include "generation.h"
#include "ui_main.h"

static system_config_t active_config;
static queue_t config_queue;
static bool engine_running = false;
static queue_t measurement_queue;

typedef struct {
    system_config_t config;
} config_message_t;

typedef struct {
    float vrms_a;
    float vrms_b;
    float frequency_hz;
} measurement_message_t;

void control_init(void) {
    queue_init(&config_queue, sizeof(config_message_t), 4);
    queue_init(&measurement_queue, sizeof(measurement_message_t), 8);

    memset(&active_config, 0, sizeof(active_config));
    active_config.core1_enabled = true;
    active_config.acquisition.sample_rate_hz = 18000000;
    active_config.acquisition.decimation = 1;
    active_config.acquisition.dual_channel = true;
    active_config.acquisition.ddr_mode = true;
    active_config.acquisition.trigger_level_mv = 0;
    active_config.acquisition.trigger_rising = true;

    active_config.generation.mode = GENERATION_MODE_DDS;
    active_config.generation.frequency_hz = 1000.0f;
    active_config.generation.amplitude_vpp = 2.0f;
    active_config.generation.offset_v = 0.0f;
    active_config.generation.duty_cycle = 0.5f;
    active_config.generation.arb_waveform = NULL;
    active_config.generation.arb_length = 0;

    acquisition_apply_config(&active_config.acquisition);
    generation_apply_config(&active_config.generation);
    acquisition_start();
    generation_start();
    engine_running = true;

    ui_on_config_changed(&active_config);
}

void control_set_config(const system_config_t *config) {
    config_message_t msg = {.config = *config};
    if (!queue_try_add(&config_queue, &msg)) {
        // If queue is full, drop the oldest entry and enqueue the newest configuration.
        queue_try_remove(&config_queue, &msg);
        queue_try_add(&config_queue, &msg);
    }
}

const system_config_t *control_get_config(void) {
    return &active_config;
}

void control_process(void) {
    config_message_t msg;
    while (queue_try_remove(&config_queue, &msg)) {
        bool restart_required = engine_running;
        if (restart_required) {
            acquisition_stop();
            generation_stop();
        }

        active_config = msg.config;

        acquisition_apply_config(&active_config.acquisition);
        generation_apply_config(&active_config.generation);

        if (restart_required) {
            acquisition_start();
            generation_start();
        }

        ui_on_config_changed(&active_config);
    }

    measurement_message_t meas;
    while (queue_try_remove(&measurement_queue, &meas)) {
        ui_publish_measurements(meas.vrms_a, meas.vrms_b, meas.frequency_hz);
    }
}

void control_publish_measurement(float vrms_a, float vrms_b, float frequency_hz) {
    measurement_message_t msg = {
        .vrms_a = vrms_a,
        .vrms_b = vrms_b,
        .frequency_hz = frequency_hz,
    };
    if (!queue_try_add(&measurement_queue, &msg)) {
        queue_try_remove(&measurement_queue, &msg);
        queue_try_add(&measurement_queue, &msg);
    }
}
