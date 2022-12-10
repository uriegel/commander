module ProgressStream

open System.IO
open System

type ProgressStream(stream: Stream, progress) = 
    inherit Stream() 

    override this.CanRead = stream.CanRead
    override this.CanSeek = stream.CanSeek
    override this.CanTimeout = stream.CanTimeout
    override this.CanWrite = stream.CanWrite
    override this.Length = stream.Length  
    override this.Position 
        with get() = stream.Position
        and set(value) = stream.Position <- value
    override this.ReadTimeout 
        with get() = stream.ReadTimeout
        and set(value) = stream.ReadTimeout <- value
    override this.WriteTimeout 
        with get() = stream.WriteTimeout
        and set(value) = stream.WriteTimeout <- value

    override this.Flush() = stream.Flush()
    override this.Read(buffer, offset, count) = 
        let pos = stream.Position
        let read = stream.Read(buffer, offset, count)
        pos + (int64)read 
        |> progress 
        read
    override this.Seek(offset, origin) = stream.Seek(offset, origin)
    override this.SetLength(value) = stream.SetLength(value)
    override this.Write(buffer, offset, count) = stream.Write(buffer, offset, count)

    override this.Close() =
        stream.Close()

    interface IDisposable with
        member this.Dispose() =
            stream.Dispose ()