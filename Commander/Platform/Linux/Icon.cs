#if Linux
using System.Diagnostics;
using System.Reflection.Metadata.Ecma335;

static class Icon
{
    public static async Task<byte[]> GetAsync(string name)
    {
        await semaphore.WaitAsync();
        try
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            await (inWriter?.WriteLineAsync(name) ?? Task.CompletedTask);
            await (inWriter?.FlushAsync() ?? Task.CompletedTask);

            // Read 8-byte length header
            var lenBuf = new byte[8];
            var read = 0;
            while (read < 8)
            {
                var n = await outStream.ReadAsync(lenBuf, read, 8 - read);
                if (n == 0)
                    throw new EndOfStreamException("Child closed stdout while reading header");
                read += n;
            }
            var payloadLen = BitConverter.ToUInt64(lenBuf, 0);

            // Read payloadLen bytes
            byte[] payload = new byte[payloadLen];
            int received = 0;
            while (received < (int)payloadLen)
            {
                int n = await outStream.ReadAsync(payload, received, (int)payloadLen - received);
                if (n == 0)
                    throw new EndOfStreamException("Child closed stdout while reading payload");
                received += n;
            }
            Console.WriteLine($"GetIcon for {name} took: {stopwatch.Elapsed.TotalMilliseconds} ms");
            return payload;
        }
        finally
        {
            semaphore.Release();
        }
    }

    public static bool IsSvg(this byte[] payload) 
        => payload.Length > 4 
        && payload[0] == 60
        && payload[1] == 115 
        && payload[2] == 118 
        && payload[3] == 103;

    public static void StopProcessing()
    {
        // Close stdin to tell child no more input (optional)
        process?.StandardInput.Close();
        // process?.WaitForExit();
        // string stderr = await stderrTask;
        // if (!string.IsNullOrEmpty(stderr)) 
        //     Console.Error.WriteLine(stderr);
    }

    static Icon()
    {
        var psi = new ProcessStartInfo
        {
            FileName = "Native/icon",
            Arguments = "",
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        process = Process.Start(psi);
        if (process == null)
            Console.Error.WriteLine("Could not start icon retriever process");

        stderrTask = process?.StandardError.ReadToEndAsync() ?? Task.FromResult("not started");
        outStream = process?.StandardOutput.BaseStream ?? new MemoryStream();
        inWriter = process?.StandardInput;
    }

    static readonly SemaphoreSlim semaphore = new(1, 1);
    static readonly Process? process;
    static readonly Task<string> stderrTask;
    static readonly Stream outStream;
    static readonly StreamWriter? inWriter;
}

#endif