#pragma once
#include <napi.h>

Napi::Value GetRecommendedApps(const Napi::CallbackInfo& info);
Napi::Value UnrefApp(const Napi::CallbackInfo &info);