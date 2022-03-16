module PlatformModel

type FileVersion = {
    Major: int
    Minor: int
    Patch: int
    Build: int
}

type EnhancedItem = {
    Index:    int
    ExifTime: System.DateTime option
    version:  FileVersion option
}
