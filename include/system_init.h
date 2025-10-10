#ifndef SYSTEM_INIT_H
#define SYSTEM_INIT_H

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

bool system_init(void);
void system_tasks(void);

#ifdef __cplusplus
}
#endif

#endif // SYSTEM_INIT_H
