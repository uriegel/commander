module Images

open System.Drawing.Imaging
open System.Drawing

let test () = 

    let enc = Encoder.Transformation
    use encParms = new EncoderParameters 1 

    let codecInfo = 
        let filter (codec: ImageCodecInfo) =
            match codec.FormatID with
            | a when a = ImageFormat.Jpeg.Guid 
                -> Some codec
            | _ -> None

        ImageCodecInfo.GetImageEncoders ()
        |> Array.tryPick filter 

    let pic = Image.FromFile("fileName") 

    use encParm = new EncoderParameter(enc, (int64)EncoderValue.TransformRotate90) 
    encParms.Param[0] <- encParm;
    
    pic.Save ("FileNameTemp", codecInfo.Value, encParms) 

    ()