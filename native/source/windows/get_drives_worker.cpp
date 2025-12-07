#include <windows.h>
#include <shlobj.h>
#include <array>
#include <vector>
#include <napi.h>
#include "get_drives_worker.h"
#include "platform.h"
#include "../std_utils.h"
using namespace Napi;
using namespace std;

enum class Drive_type {
	UNKNOWN,
	HARDDRIVE,
	ROM,
	REMOVABLE,
	NETWORK,
	HOME
};

string drivetype_to_string(Drive_type dt);

struct Drive_item {
	stdstring name;
	stdstring description;
	uint64_t size;
	Drive_type type;
	bool is_mounted;
};

vector<Drive_item> get_drives();

class Get_drives_worker : public AsyncWorker {
public:
    Get_drives_worker(const Napi::Env& env)
    : AsyncWorker(env)
    , deferred(Promise::Deferred::New(Env())) {}
    ~Get_drives_worker() {}

    void Execute () { drives = move(get_drives()); }

    void OnOK();

    Napi::Promise Promise() { return deferred.Promise(); }

private:
    Promise::Deferred deferred;
    vector<Drive_item> drives;
};

void Get_drives_worker::OnOK() {
    HandleScope scope(Env());

    auto array = Array::New(Env(), drives.size());
    int i{0};
    for(auto item: drives) {
        auto obj = Object::New(Env());

        obj.Set("name", nodestring::New(Env(), item.name));
        obj.Set("description", nodestring::New(Env(), item.description));
        if (item.size != -1)
            obj.Set("size", Number::New(Env(), static_cast<double>(item.size)));
        obj.Set("type", String::New(Env(), drivetype_to_string(item.type))); 
        obj.Set("isMounted", Boolean::New(Env(), item.is_mounted));

        array.Set(i++, obj);
    }

    deferred.Resolve(array);
}

wstring getHomeDirectory() {
    wchar_t path[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_PROFILE, nullptr, 0, path))) 
        return wstring(path);
    else
		return L"C:\\"s;
}

class file_handle
{
public:
	file_handle(HANDLE handle) : handle(handle) {}
	~file_handle() {
		if (handle != INVALID_HANDLE_VALUE)
			CloseHandle(handle);
	}
	operator HANDLE() const { return handle; }
private:
	HANDLE handle{ INVALID_HANDLE_VALUE };
};

const wstring get_drive_description(const wstring& name) {
	array<wchar_t, 400> buffer;
	if (GetVolumeInformationW(name.c_str(), buffer.data(), static_cast<DWORD>(buffer.size()), nullptr, nullptr, nullptr, nullptr, 0))
		return wstring(buffer.data(), wcslen(buffer.data()));
	else
		return wstring();
}

uint64_t get_volume_size(const wstring& directory_on_drive) {
	ULARGE_INTEGER result{ 0 };
	GetDiskFreeSpaceExW(directory_on_drive.c_str(), nullptr, &result, nullptr);
	return result.QuadPart;
}

Drive_type get_drive_type(unsigned int type) {
	switch (type)
	{
	case 2:
		return Drive_type::REMOVABLE;
	case 3:
		return Drive_type::HARDDRIVE;
	case 4:
		return Drive_type::NETWORK;
	case 5:
		return Drive_type::ROM;
	default:
		return Drive_type::UNKNOWN;
	}
}

bool is_mounted(const file_handle& volume) {
	if (volume == INVALID_HANDLE_VALUE)
		// 2 means "no disk", anything else means by inference "disk
		// in drive, but you do not have admin privs to do a
		// CreateFile on that volume".
		return GetLastError() != 2;

	DWORD bytes_returned; // ignored
	auto result = DeviceIoControl(volume, FSCTL_IS_VOLUME_MOUNTED, nullptr, 0, nullptr, 0, &bytes_returned, nullptr);
	return result != 0;
}

vector<Drive_item> get_drives() {
  	array<wchar_t, 500> buffer;
	auto size = GetLogicalDriveStringsW(static_cast<DWORD>(buffer.size()), buffer.data());
	const wstring drive_string(buffer.data(), size);
	auto drives = split(drive_string, 0);

	vector<Drive_item> result;
	transform(drives.begin(), drives.end(), back_inserter(result), [](const wstring & val) {
		auto type = GetDriveTypeW(val.c_str());
		auto volume = wstring{ L"\\\\.\\" + val.substr(0, 2) };
		file_handle volume_handle(CreateFileW(volume.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
			nullptr, OPEN_EXISTING, 0, nullptr));
		return move(Drive_item
			{
				val,
				move(get_drive_description(val)),
				get_volume_size(val),
				get_drive_type(type),
				type != 3 ? is_mounted(volume_handle) : true
			});
		});

	result.insert(result.begin(), move(Drive_item {
		getHomeDirectory(),
		L"Start"s,
		(uint64_t)-1,
		Drive_type::HOME,
		true
	}));

	// auto erase_it = remove_if(drive_items.begin(), drive_items.end(), [](const Drive_item & val) {
	// 	return !val.is_mounted;
	// 	});
	// drive_items.erase(erase_it, drive_items.end());
	return result;
}

string drivetype_to_string(Drive_type dt) {
	switch (dt) {
		case Drive_type::UNKNOWN:
			return "UNKNOWN"s;
		case Drive_type::HARDDRIVE:
			return "HARDDRIVE"s;
		case Drive_type::ROM:
			return "ROM"s;
		case Drive_type::REMOVABLE:
			return "REMOVABLE"s;
		case Drive_type::NETWORK:
			return "NETWORK"s;
		case Drive_type::HOME:
			return "HOME"s;
		default:
			return "UNKNOWN"s;
	}
}

Value GetDrives(const CallbackInfo& info) {
    auto worker = new Get_drives_worker(info.Env());
    worker->Queue();
    return worker->Promise();
}