#pragma once
#include <tuple>
#include "platform.h"

std::tuple<int, stdstring, stdstring> delete_files(const std::vector<stdstring>& files);