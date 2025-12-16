#include <napi.h>
#include <vector>
#include <gio/gio.h>
#include "get_all_apps_worker.h"
using namespace Napi;
using namespace std;

struct App {
    string name;
    string executable;
    GAppInfo* app;
};

vector<App> get_all_apps() {
    vector<App> result;

    // all apps
    auto all_apps = g_app_info_get_all();
    for (auto l = all_apps; l != nullptr; l = l->next) {
        auto app = G_APP_INFO(l->data);

        auto exe = g_app_info_get_executable(app);
        if (exe != nullptr) {
            result.push_back({
                g_app_info_get_name(app), 
                exe,
                app
            });
        }
    }
    g_list_free(all_apps);
    return result;
}

class Get_all_apps : public AsyncWorker
{
public:
    Get_all_apps(const Napi::Env& env)
    : AsyncWorker(env)
    , deferred(Promise::Deferred::New(Env())) {}
    ~Get_all_apps() {}

    void Execute () { result = move(get_all_apps()); }

    void OnOK();

    Napi::Promise Promise() { return deferred.Promise(); }

private:
    Promise::Deferred deferred;
    vector<App> result;
};

void Get_all_apps::OnOK() {
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

Value GetAllApps(const CallbackInfo& info) {
    auto worker = new Get_all_apps(info.Env());
    worker->Queue();
    return worker->Promise();
}

