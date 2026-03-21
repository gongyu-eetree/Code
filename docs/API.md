# API

## POST /api/selection/parse
Input: `SelectionRequest`
Output: `ParsedConstraints`
Purpose: parse natural language and infer scenario, interfaces, stage, and skill gaps.

## POST /api/selection/search
Input: `SelectionRequest`
Output: filtered `FPGADevice[]`
Purpose: apply hard constraints before scoring.

## POST /api/selection/rank
Input: `SelectionRequest`
Output: ranked results without full recommendation text.
Purpose: inspect score breakdowns and compare devices.

## POST /api/selection/recommend
Input: `SelectionRequest`
Output: `SelectionResponse`
Purpose: end-to-end decision support with explanations, alternatives, boards, and risks.

## GET /api/devices
Output: all sample devices.

## GET /api/devices/:id
Output: single device plus suggested boards.
