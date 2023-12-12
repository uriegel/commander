export enum ServiceStatus {
    Stopped = 1,
    Starting,
    Stopping,
    Running
}

export enum ServiceStartMode {
    Boot, 
    System,
    Automatic,
    Manual,
    Disabled
}

export enum IconNameType {
    Parent,
    Root,
    Home,
    Folder,
    File,
    Remote,
    Android,
    New,
    Service,
    Favorite
}
