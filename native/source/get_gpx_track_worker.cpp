#include <napi.h>
#include <vector>
#include "tinyxml2.h"
#include "get_gpx_track_worker.h"
#include "std_utils.h"
#if WINDOWS
    #include "windows/utils.h"
#endif 
using namespace Napi;
using namespace std;
using namespace tinyxml2;

struct GpxPoint {
    double lat = 0.0;
    double lon = 0.0;
    double ele = 0.0;
    stdstring time;
    int heartrate = 0;
    double velocity = 0;
};

struct GpxTrack {
    double distance = 0.0;
    int duration = 0;
    stdstring date;
    stdstring name;
    double averageSpeed = 0;
    std::vector<GpxPoint> trackPoints{};
};

GpxTrack get_gpx_track(const stdstring& path);

class Get_gpx_track_worker : public AsyncWorker {
public:
    Get_gpx_track_worker(const Napi::Env& env, const stdstring& path)
    : AsyncWorker(env)
    , path(path)
    , deferred(Promise::Deferred::New(Env())) {}
    ~Get_gpx_track_worker() {}

    void Execute () { gpx_track = move(get_gpx_track(path)); }

    void OnOK();

    Napi::Promise Promise() { return deferred.Promise(); }

private:
    stdstring path;
    Promise::Deferred deferred;
    GpxTrack gpx_track;
};

void Get_gpx_track_worker::OnOK() {
    HandleScope scope(Env());

    auto obj = Object::New(Env());

    obj.Set("name", nodestring::New(Env(), gpx_track.name));
    obj.Set("distance", Number::New(Env(), static_cast<double>(gpx_track.distance)));
    obj.Set("duration", Number::New(Env(), static_cast<int>(gpx_track.duration)));
    obj.Set("date", nodestring::New(Env(), gpx_track.date));
    obj.Set("averageSpeed", Number::New(Env(), static_cast<int>(gpx_track.averageSpeed)));

    auto array = Array::New(Env(), gpx_track.trackPoints.size());
    int i{0};
    for(auto item: gpx_track.trackPoints) {
        auto pnt = Object::New(Env());

        pnt.Set("lat", Number::New(Env(), item.lat));
        pnt.Set("lon", Number::New(Env(), item.lon));
        pnt.Set("ele", Number::New(Env(), item.ele));
        pnt.Set("time", nodestring::New(Env(), item.time));
        pnt.Set("heartrate", Number::New(Env(), item.heartrate));
        pnt.Set("velocity", Number::New(Env(), item.velocity));
        array.Set(i++, pnt);
    }
    obj.Set("trackPoints", array);

    deferred.Resolve(obj);
}

Value GetGpxTrack(const CallbackInfo& info) {
    auto path = (stdstring)info[0].As<nodestring>();
    auto worker = new Get_gpx_track_worker(info.Env(), path);
    worker->Queue();
    return worker->Promise();
}

// Helper: strip XML namespace prefix (e.g. "gpx:trkpt" → "trkpt")
static const char* stripNamespace(const char* name) {
    if (!name) return "";
    const char* colon = std::strchr(name, ':');
    return colon ? colon + 1 : name;
}

// Helper: find first child element matching a local name (ignores namespaces)
static XMLElement* FirstChildElementNS(XMLElement* parent, const char* localName) {
    for (XMLElement* el = parent ? parent->FirstChildElement() : nullptr; el; el = el->NextSiblingElement()) {
        if (std::strcmp(stripNamespace(el->Name()), localName) == 0)
            return el;
    }
    return nullptr;
}

// Helper: find next sibling element matching a local name (ignores namespaces)
static XMLElement* NextSiblingElementNS(XMLElement* elem, const char* localName) {
    for (XMLElement* el = elem ? elem->NextSiblingElement() : nullptr; el; el = el->NextSiblingElement()) {
        if (std::strcmp(stripNamespace(el->Name()), localName) == 0)
            return el;
    }
    return nullptr;
}

GpxTrack get_gpx_track(const stdstring& path) {
    XMLDocument doc;
    GpxTrack gpxTrack{};
#ifdef LINUX    
    if (doc.LoadFile(path.c_str()) != XML_SUCCESS)
#else    
    if (doc.LoadFile(convertToString(path).c_str()) != XML_SUCCESS)
#endif    
        return gpxTrack;

    auto gpx = doc.RootElement();
    if (!gpx) 
        return gpxTrack;

    for (auto trk = FirstChildElementNS(gpx, "trk"); trk; trk = NextSiblingElementNS(trk, "trk")) {
        for (auto info = FirstChildElementNS(trk, "info"); info; info = NextSiblingElementNS(info, "info")) {
            if (auto ele = FirstChildElementNS(info, "distance"))
                ele->QueryDoubleText(&gpxTrack.distance);
            if (auto ele = FirstChildElementNS(info, "duration"))
                ele->QueryIntText(&gpxTrack.duration);
            if (auto ele = FirstChildElementNS(info, "averageSpeed"))
                ele->QueryDoubleText(&gpxTrack.averageSpeed);
#ifdef LINUX                    
            if (auto ele = FirstChildElementNS(info, "name"))
                gpxTrack.name = ele->GetText();
            if (auto ele = FirstChildElementNS(info, "date"))
                gpxTrack.date = ele->GetText();
#else
            if (auto ele = FirstChildElementNS(info, "name"))
                gpxTrack.name = convertToWString(ele->GetText());
            if (auto ele = FirstChildElementNS(info, "date"))
                gpxTrack.date = convertToWString(ele->GetText());
#endif                    
        }
        for (auto trkseg = FirstChildElementNS(trk, "trkseg"); trkseg; trkseg = NextSiblingElementNS(trkseg, "trkseg")) {
            for (auto trkpt = FirstChildElementNS(trkseg, "trkpt"); trkpt; trkpt = NextSiblingElementNS(trkpt, "trkpt")) {
                GpxPoint point{};

                // Read lat/lon attributes
                trkpt->QueryDoubleAttribute("lat", &point.lat);
                trkpt->QueryDoubleAttribute("lon", &point.lon);

                // Optional: read elevation
                if (auto ele = FirstChildElementNS(trkpt, "ele"))
                    ele->QueryDoubleText(&point.ele);

                if (auto ele = FirstChildElementNS(trkpt, "speed"))
                    ele->QueryDoubleText(&point.velocity);

                if (auto ele = FirstChildElementNS(trkpt, "heartrate"))
                    ele->QueryIntText(&point.heartrate);

#ifdef LINUX                                        
                if (auto time = FirstChildElementNS(trkpt, "time"))
                    point.time = time->GetText() ? time->GetText() : "";
#else
                if (auto time = FirstChildElementNS(trkpt, "time"))
                    point.time = convertToWString(time->GetText() ? time->GetText() : "");
#endif
                gpxTrack.trackPoints.push_back(point);
            }
        }
    }

    return gpxTrack;
}