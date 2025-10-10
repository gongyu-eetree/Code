#ifndef CONTROL_H
#define CONTROL_H

#include <stdbool.h>
#include "acquisition.h"
#include "generation.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    acquisition_config_t acquisition;
    generation_config_t generation;
    bool core1_enabled;
} system_config_t;

void control_init(void);
void control_set_config(const system_config_t *config);
const system_config_t *control_get_config(void);
void control_process(void);
void control_publish_measurement(float vrms_a, float vrms_b, float frequency_hz);

#ifdef __cplusplus
}
#endif

#endif // CONTROL_H
