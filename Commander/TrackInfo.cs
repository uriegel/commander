using System.Text.Json;
using System.Xml.Serialization;
using CsTools.Functional;
using CsTools.HttpRequest;
using static CsTools.Core;

record TrackInfoData();


[XmlRoot(ElementName = "gpx", Namespace = "http://www.topografix.com/GPX/1/0")]
public class GpxInfo
{
    [XmlElement("trk")]
    public Track? Track;
}

public class Track
{
    [XmlElement("name")]
    public string? Name;
    
    [XmlElement("desc")]
    public string? Description;

    [XmlElement("trkseg")]
    public TrackSegment? TrackSegment;
}

public class TrackSegment
{
    [XmlElement("trkpt")]
    public TrackPoint[]? TrackPoints;
}

public class TrackPoint
{
    [XmlAttribute("lat")]
    public double Latitude;
    [XmlAttribute("lon")]
    public double Longitude;

    [XmlElement("ele")]
    public double Elevation;

    [XmlElement("time")]
    public DateTime Time;
}


static class TrackInfo {
    public static AsyncResult<TrackInfoData, RequestError> Get(GetTrackInfoParam param) 
    {

        var serializer = new XmlSerializer(typeof(GpxInfo));
        using var stream = File.OpenRead(param.Path);
        var obj = serializer.Deserialize(stream) as GpxInfo;
        var json = JsonSerializer.Serialize<GpxInfo>(obj!);

        return Ok<TrackInfoData, RequestError>(new TrackInfoData()).ToAsyncResult();
    }
}