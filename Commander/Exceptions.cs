public class AlreadyMountedException : Exception { }

public class MountException(string message) : Exception(message) {}
    
public class NotMountedException() : Exception {}

public class NetworknameNotFoundException() : Exception {}

public class WrongCredentialsException() : Exception {}