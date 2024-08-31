module TrackInfo
open System
open System.IO
open System.Xml.Serialization

type TrackPoint = {
    Latitude: double
    Longitude: double
    Elevation: double
    Time: string option
    Heartrate: int
    Velocity: float
}

type TrackInfoData = {
    Name: string option
    Description: string option
    Distance: float
    Duration: int
    AverageSpeed: float
    AverageHeartRate: int
    TrackPoints: TrackPoint[] option
}

type Info = {
    [<XmlElement("date")>]
    Date: string option
    [<XmlElement("distance")>]
    Distance: float
    [<XmlElement("duration")>]
    Duration: int
    [<XmlElement("averageSpeed")>]
    AverageSpeed: float
}

type XmlTrack = {
    [<XmlElement("name")>]
    Name: string option
    
    [<XmlElement("desc")>]
    Description: string option

    [<XmlElement("info")>]
    Info: Info option

    Elevation: double

    [<XmlElement("time")>]
    Time: string option

    [<XmlElement("speed")>]
    Speed: float option

    [<XmlElement("heartrate")>]
    HeartRate: int option
}

//[XmlRoot(ElementName = "gpx", Namespace = "http://www.topografix.com/GPX/1/0")]
[<XmlRoot(ElementName = "gpx")>]
type XmlTrackInfo = {
    [<XmlElement("trk")>]
    Track: XmlTrack option
}

type XmlTrackPoint = {
    [<XmlAttribute("lat")>]
    Latitude: double
    [<XmlAttribute("lon")>]
    Longitude: double

    [<XmlElement("ele")>]
    Elevation: double

    [<XmlElement("time")>]
    Time: string option

    [<XmlElement("speed")>]
    Speed: float option

    [<XmlElement("heartrate")>]
    HeartRate: int option
}

type XmlTrackSegment = {
    [<XmlElement("trkpt")>]
    TrackPoints: XmlTrackPoint[] option
}

type GetTrackInfoParam = {
    Path: string
}

let deserializeTrack (param: GetTrackInfoParam) = 
//     public static AsyncResult<TrackInfoData, RequestError> Get(GetTrackInfoParam param) 
//     {
    let serializer = XmlSerializer(typedefof<XmlTrackInfo>)
    use stream = File.OpenRead param.Path
    let xmlTrackInfo = serializer.Deserialize stream  :?> XmlTrackInfo
    let old = 
        xmlTrackInfo.Track 
        |> Option.bind (fun track -> 
            track.Info
            |> Option.bind (fun info -> 
                info.Date
                |> Option.map (fun date -> DateTime.Parse(date) < DateTime(2021, 1, 1))
            )
        )
        |> Option.defaultValue false

    ()
    // let trackInfo = TrackInfoData(
    //         xmlTrackInfo?.Track?.Name, 
//             xmlTrackInfo?.Track?.Description, 
//             xmlTrackInfo?.Track?.Info?.Distance ?? 0,
//             xmlTrackInfo?.Track?.Info?.Duration ?? 0,
//             xmlTrackInfo?.Track?.Info?.AverageSpeed ?? 0,
//             (int)(xmlTrackInfo
//                 ?.Track
//                 ?.TrackSegment
//                 ?.TrackPoints
//                 ?.Select(n => n.HeartRate)
//                 ?.Average() ?? 0),
//             xmlTrackInfo
//                 ?.Track
//                 ?.TrackSegment
//                 ?.TrackPoints
//                 ?.Select(n => new TrackPoint(n.Latitude, n.Longitude, n.Elevation, n.Time, n.HeartRate ?? 0, old ? n.Speed ?? 0 : (n.Speed  ?? 0) * 3.6f))
//                     .ToArray());
//         return Ok<TrackInfoData, RequestError>(trackInfo).ToAsyncResult();
//     }
// }