#pragma once
#include <vector>
#include <gio/gio.h>
#include "std_utils.h"

void checkInitializeIcons();
std::vector<char> get_icon(const stdstring& extension);
std::vector<char> get_icon_from_name(const stdstring& name);
#if LINUX
    std::vector<char> get_app_icon(GAppInfo* app);
#endif

