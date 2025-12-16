#include <napi.h>
#if WINDOWS
    #include "windows/platform.h"
    #include "windows/get_drives_worker.h"
    #include "windows/create_directory_worker.h"
    #include "windows/process_file.h"
    #include "windows/rename_worker.h"
    #include "windows/get_versions_worker.h"
    #include "windows/network_share_worker.h"
#elif LINUX
    #include "linux/platform.h"
    #include "linux/accent_color.h"
    #include "linux/get_recommended_apps_worker.h"
    #include "linux/get_app_icon_worker.h"
#endif
#include "get_files_worker.h"
#include "get_icon_worker.h"
#include "get_icon_from_name_worker.h"
#include "get_exif_infos_worker.h"
#include "get_gpx_track_worker.h"
#include "copy_worker.h"
#include "trash_worker.h"
#include "cancellation.h"
#include "error.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    exports.Set(String::New(env, "getFiles"), Function::New(env, GetFiles));
    exports.Set(String::New(env, "getIcon"), Function::New(env, GetIcon));
    exports.Set(String::New(env, "getIconFromName"), Function::New(env, GetIconFromName));
    exports.Set(String::New(env, "getExifInfos"), Function::New(env, GetExifInfos));
    exports.Set(String::New(env, "getGpxTrackAsync"), Function::New(env, GetGpxTrack));
    exports.Set(String::New(env, "trash"), Function::New(env, Trash));
    exports.Set(String::New(env, "copy"), Function::New(env, Copy));
    exports.Set(String::New(env, "cancel"), Function::New(env, Cancel));
#if WINDOWS    
    exports.Set(String::New(env, "getDrives"), Function::New(env, GetDrives));
    exports.Set(String::New(env, "createFolder"), Function::New(env, CreateFolder));
    exports.Set(String::New(env, "openFile"), Function::New(env, OpenFile));
    exports.Set(String::New(env, "openFileWith"), Function::New(env, OpenFileWith));
    exports.Set(String::New(env, "showFileProperties"), Function::New(env, ShowFileProperties));
    exports.Set(String::New(env, "getVersionInfos"), Function::New(env, GetVersions));
    exports.Set(String::New(env, "addNetworkShare"), Function::New(env, AddNetworkShare));
    exports.Set(String::New(env, "rename"), Function::New(env, Rename));
    //exports.Set(String::New(env, "getServices"), Function::New(env, GetServices));    
#else 
    setlocale(LC_MESSAGES, "");
    setlocale(LC_CTYPE, "");
    exports.Set(String::New(env, "getAccentColor"), Function::New(env, GetAccentColor));
    exports.Set(String::New(env, "getErrorMessage"), Function::New(env, GetErrorMessage));
    exports.Set(String::New(env, "getRecommendedApps"), Function::New(env, GetRecommendedApps));
    exports.Set(String::New(env, "getAppIcon"), Function::New(env, GetAppIcon));
    exports.Set(String::New(env, "unrefApp"), Function::New(env, UnrefApp));
#endif
    return exports;    
}

const char* addon = "_native";
NODE_API_MODULE(addon, Init)