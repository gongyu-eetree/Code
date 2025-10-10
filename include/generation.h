#ifndef GENERATION_H
#define GENERATION_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    GENERATION_MODE_DDS,
    GENERATION_MODE_ARB,
    GENERATION_MODE_PWM,
    GENERATION_MODE_DC
} generation_mode_t;

typedef struct {
    generation_mode_t mode;
    float frequency_hz;
    float amplitude_vpp;
    float offset_v;
    float duty_cycle;
    const uint16_t *arb_waveform;
    size_t arb_length;
} generation_config_t;

void generation_init(void);
void generation_apply_config(const generation_config_t *config);
void generation_start(void);
void generation_stop(void);

#ifdef __cplusplus
}
#endif

#endif // GENERATION_H
