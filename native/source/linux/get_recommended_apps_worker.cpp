#include <napi.h>
#include <vector>
#include <gio/gio.h>
#include "get_recommended_apps_worker.h"
using namespace Napi;
using namespace std;

struct App {
    string name;
    string executable;
    GAppInfo* app;
};

vector<App> get_recommended_apps(string file_path) {
    auto file = g_file_new_for_path(file_path.c_str());

    vector<App> result;

    // Get content type
    GError *error = nullptr;
    auto info = g_file_query_info(file, "standard::content-type", G_FILE_QUERY_INFO_NONE, nullptr, &error);
    if (!info) {
        g_error_free(error);
        g_object_unref(file);
        return result;
    }

    auto content_type = g_file_info_get_content_type(info);

    // Recommended apps
    auto recommended = g_app_info_get_recommended_for_type(content_type);
    for (auto l = recommended; l != nullptr; l = l->next) {
        auto app = G_APP_INFO(l->data);

        result.push_back({
            g_app_info_get_name(app), 
            g_app_info_get_executable(app),
            app
        });
    }
    g_list_free(recommended);
    g_object_unref(file);
    return result;
}

class Get_recommended_apps : public AsyncWorker
{
public:
    Get_recommended_apps(const Napi::Env& env, const string& file)
    : AsyncWorker(env)
    , file(file)
    , deferred(Promise::Deferred::New(Env())) {}
    ~Get_recommended_apps() {}

    void Execute () { result = move(get_recommended_apps(file)); }

    void OnOK();

    Napi::Promise Promise() { return deferred.Promise(); }

private:
    string file;
    Promise::Deferred deferred;
    vector<App> result;
};

void Get_recommended_apps::OnOK() {
    HandleScope scope(Env());

    auto array = Array::New(Env(), result.size());
    int i{0};
    for(auto item: result) {
        auto obj = Object::New(Env());
        obj.Set("name", String::New(Env(), item.name));
        obj.Set("executable", String::New(Env(), item.executable));
        obj.Set("app", Number::New(Env(), (uint64_t)item.app));
        array.Set(i++, obj);
    }
    deferred.Resolve(array);
}

Value GetRecommendedApps(const CallbackInfo& info) {
    auto file = info[0].As<String>();
    auto worker = new Get_recommended_apps(info.Env(), file);
    worker->Queue();
    return worker->Promise();
}

Value UnrefApp(const CallbackInfo& info) {
    auto app = (GAppInfo*)info[0].As<Number>().Int64Value();
    g_object_unref(app);
    return info.Env().Undefined();
}
