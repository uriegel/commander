#include <napi.h>
#include <vector>
#include <optional>
#include <Windows.h>
#include "get_versions_worker.h"
#include "platform.h"
#include "..\cancellation.h"
using namespace Napi;
using namespace std;

struct Version_info {
    Version_info() {}

    Version_info(int major, int minor, int build, int patch) 
    : major(major)
    , minor(minor)
    , build(build)
    , patch(patch) {}

    int major;
    int minor;
    int build;
    int patch;
};

std::optional<Version_info> get_file_info_version(const stdstring& file_name);

vector<VersionInfoResult> get_versions(vector<VersionsInput>& input, wstring cancellation) {
	vector<VersionInfoResult> output;

	register_cancellable(cancellation);

	for (auto& vi: input) {
		if (is_cancelled(cancellation))
			return vector<VersionInfoResult>();

		auto version = get_file_info_version(vi.path);
        if (version.has_value()) {
            VersionInfoResult vir { vi.idx, { 
                version.value().major,
                version.value().minor,
                version.value().build,
                version.value().patch
            } }; 
            
            output.push_back(vir);
        }
	}

	unregister_cancellable(cancellation);

	return output;
}

class Get_versions_worker : public AsyncWorker {
public:
    Get_versions_worker(const Napi::Env& env, const vector<VersionsInput>& input, wstring cancellation)
    : AsyncWorker(env)
    , deferred(Promise::Deferred::New(Env()))
    , input(input) 
    , cancellation(cancellation) {}
    ~Get_versions_worker() {}

    void Execute () { versions = get_versions(input, cancellation); }

    void OnOK();

    Napi::Promise Promise() { return deferred.Promise(); }

private:
    Napi::Promise::Deferred deferred;
    vector<VersionsInput> input;
    wstring cancellation;
    vector<VersionInfoResult> versions;
};

void Get_versions_worker::OnOK() {
    auto env = Env();
    HandleScope scope(env);


    auto array = Array::New(Env(), versions.size());
    int i{0};
    for(auto item: versions) {
        auto obj = Object::New(Env());
        obj.Set("idx", Number::New(Env(), static_cast<int>(item.idx)));
        auto versionObj = Object::New(Env());
        versionObj.Set("major", Number::New(Env(), static_cast<double>(item.info.major)));
        versionObj.Set("minor", Number::New(Env(), static_cast<double>(item.info.minor)));
        versionObj.Set("build", Number::New(Env(), static_cast<double>(item.info.build)));
        versionObj.Set("patch", Number::New(Env(), static_cast<double>(item.info.patch)));
        obj.Set("info", versionObj);
        array.Set(i++, obj);
    }
    deferred.Resolve(array);
}

Value GetVersions(const CallbackInfo& info) {
    auto inputs = info[0].As<Array>();
    auto count = inputs.Length();
    vector<VersionsInput> input;
    for (auto i = 0u; i < count; i++) {
        auto val = inputs.Get(i);
        auto obj = val.As<Object>();
        VersionsInput vi;
        vi.path = obj.Get("path").As<nodestring>();
        vi.idx = obj.Get("idx").As<Number>().Int32Value();
        input.push_back(vi);
    }

    auto cancelation = (info.Length() > 1) ? info[1].As<nodestring>() : wstring();

    auto worker = new Get_versions_worker(info.Env(), input, cancelation);
    worker->Queue();
    return worker->Promise();
}

optional<Version_info> get_file_info_version(const wstring& file_name) {
    DWORD _{0};
    auto size = GetFileVersionInfoSizeW(file_name.c_str(), &_);
    if (size == 0)
        return nullopt;
	vector<char> data(size);
	auto ok = GetFileVersionInfoW(file_name.c_str(), 0, size, data.data());
	VS_FIXEDFILEINFO *info{nullptr};
	uint32_t len{0};
	VerQueryValueW(data.data(), L"\\", reinterpret_cast<void**>(&info), &len);

    return make_optional<Version_info>(
        HIWORD(info->dwFileVersionMS),
        LOWORD(info->dwFileVersionMS),
        HIWORD(info->dwFileVersionLS),
        LOWORD(info->dwFileVersionLS)
	);
}