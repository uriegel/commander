using System.Xml.Serialization;
using CsTools.Functional;
using CsTools.HttpRequest;
using static CsTools.Core;

record TrackInfoData(
    string? Name,
    string? Description,
    TrackPoint[]? TrackPoints
);

record TrackPoint(
    double Latitude,
    double Longitude,
    double Elevation,
    string? Time
);

//[XmlRoot(ElementName = "gpx", Namespace = "http://www.topografix.com/GPX/1/0")]
[XmlRoot(ElementName = "gpx")]
public class XmlTrackInfo
{
    [XmlElement("trk")]
    public XmlTrack? Track;
}

public class XmlTrack
{
    [XmlElement("name")]
    public string? Name;
    
    [XmlElement("desc")]
    public string? Description;

    [XmlElement("trkseg")]
    public XmlTrackSegment? TrackSegment;
}

public class XmlTrackSegment
{
    [XmlElement("trkpt")]
    public XmlTrackPoint[]? TrackPoints;
}

public class XmlTrackPoint
{
    [XmlAttribute("lat")]
    public double Latitude;
    [XmlAttribute("lon")]
    public double Longitude;

    [XmlElement("ele")]
    public double Elevation;

    [XmlElement("time")]
    public string? Time;
}


static class TrackInfo {
    public static AsyncResult<TrackInfoData, RequestError> Get(GetTrackInfoParam param) 
    {

        var serializer = new XmlSerializer(typeof(XmlTrackInfo));
        using var stream = File.OpenRead(param.Path);
        var xmlTrackInfo = serializer.Deserialize(stream) as XmlTrackInfo;
        var trackInfo = new TrackInfoData(
            xmlTrackInfo?.Track?.Name, 
            xmlTrackInfo?.Track?.Description, 
            xmlTrackInfo
                ?.Track
                ?.TrackSegment
                ?.TrackPoints
                ?.Select(n => new TrackPoint(n.Latitude, n.Longitude, n.Elevation, n.Time))
                .ToArray());
        return Ok<TrackInfoData, RequestError>(trackInfo).ToAsyncResult();
    }
}