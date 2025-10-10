#ifndef ACQUISITION_H
#define ACQUISITION_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint32_t sample_rate_hz;
    uint8_t decimation;
    bool dual_channel;
    bool ddr_mode;
    uint16_t trigger_level_mv;
    bool trigger_rising;
} acquisition_config_t;

typedef struct {
    uint16_t *channel_a;
    uint16_t *channel_b;
    size_t length;
    uint64_t timestamp;
} acquisition_buffer_t;

void acquisition_init(void);
void acquisition_apply_config(const acquisition_config_t *config);
void acquisition_start(void);
void acquisition_stop(void);
bool acquisition_fetch_buffer(acquisition_buffer_t *buffer);
void acquisition_release_buffer(const acquisition_buffer_t *buffer);

#ifdef __cplusplus
}
#endif

#endif // ACQUISITION_H
