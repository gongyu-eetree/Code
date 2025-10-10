#include "ui_main.h"

#include <stdio.h>

#include "lvgl.h"

static lv_obj_t *label_acq_summary;
static lv_obj_t *label_gen_summary;
static lv_obj_t *label_measurements;

static void create_layout(void);

void ui_init(void) {
    create_layout();
}

void ui_on_config_changed(const system_config_t *config) {
    if (!label_acq_summary || !label_gen_summary) {
        return;
    }

    char buf[128];
    lv_snprintf(buf, sizeof(buf), "采集: %lu Hz, %s通道, 触发%s %.1fV",
                config->acquisition.sample_rate_hz,
                config->acquisition.dual_channel ? "双" : "单",
                config->acquisition.trigger_rising ? "上升" : "下降",
                config->acquisition.trigger_level_mv / 1000.0f);
    lv_label_set_text(label_acq_summary, buf);

    switch (config->generation.mode) {
        case GENERATION_MODE_DDS:
            lv_snprintf(buf, sizeof(buf), "输出: DDS %.2f Hz %.2f Vpp",
                        config->generation.frequency_hz,
                        config->generation.amplitude_vpp);
            break;
        case GENERATION_MODE_ARB:
            lv_snprintf(buf, sizeof(buf), "输出: 任意波 %.2f Hz (%u 点)",
                        config->generation.frequency_hz,
                        (unsigned)config->generation.arb_length);
            break;
        case GENERATION_MODE_PWM:
            lv_snprintf(buf, sizeof(buf), "输出: PWM %.2f Hz %.1f%%",
                        config->generation.frequency_hz,
                        config->generation.duty_cycle * 100.0f);
            break;
        case GENERATION_MODE_DC:
            lv_snprintf(buf, sizeof(buf), "输出: 直流 %.2f V",
                        config->generation.offset_v);
            break;
    }
    lv_label_set_text(label_gen_summary, buf);
}

void ui_publish_measurements(float vrms_a, float vrms_b, float frequency_hz) {
    if (!label_measurements) {
        return;
    }

    char buf[96];
    lv_snprintf(buf, sizeof(buf), "CH1 %.2f Vrms | CH2 %.2f Vrms | %.2f Hz",
                vrms_a,
                vrms_b,
                frequency_hz);
    lv_label_set_text(label_measurements, buf);
}

static void create_layout(void) {
    lv_obj_t *scr = lv_scr_act();
    lv_obj_set_style_bg_color(scr, lv_color_black(), 0);

    lv_obj_t *header = lv_label_create(scr);
    lv_obj_set_style_text_color(header, lv_color_white(), 0);
    lv_label_set_text(header, "RP2350B 多功能口袋仪表");
    lv_obj_align(header, LV_ALIGN_TOP_MID, 0, 8);

    label_acq_summary = lv_label_create(scr);
    lv_obj_set_style_text_color(label_acq_summary, lv_color_white(), 0);
    lv_obj_align(label_acq_summary, LV_ALIGN_TOP_LEFT, 8, 32);

    label_gen_summary = lv_label_create(scr);
    lv_obj_set_style_text_color(label_gen_summary, lv_color_white(), 0);
    lv_obj_align(label_gen_summary, LV_ALIGN_TOP_LEFT, 8, 52);

    label_measurements = lv_label_create(scr);
    lv_obj_set_style_text_color(label_measurements, lv_color_white(), 0);
    lv_obj_align(label_measurements, LV_ALIGN_TOP_LEFT, 8, 72);
    lv_label_set_text(label_measurements, "CH1 -- Vrms | CH2 -- Vrms | -- Hz");

    lv_obj_t *wave_container = lv_obj_create(scr);
    lv_obj_set_size(wave_container, 240, 160);
    lv_obj_align(wave_container, LV_ALIGN_BOTTOM_MID, 0, -16);
    lv_obj_set_style_bg_color(wave_container, lv_color_hex(0x101030), 0);
    lv_obj_set_style_border_width(wave_container, 0, 0);

    lv_obj_t *wave_label = lv_label_create(wave_container);
    lv_label_set_text(wave_label, "示波波形区域 (由绘图小部件实现)");
    lv_obj_center(wave_label);
}
