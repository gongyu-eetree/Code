#ifndef UI_MAIN_H
#define UI_MAIN_H

#include <stdbool.h>
#include "control.h"

#ifdef __cplusplus
extern "C" {
#endif

void ui_init(void);
void ui_on_config_changed(const system_config_t *config);
void ui_publish_measurements(float vrms_a, float vrms_b, float frequency_hz);

#ifdef __cplusplus
}
#endif

#endif // UI_MAIN_H
