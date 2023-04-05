interface String {
    /** 
     * Returns a substring after a found char, not including the char 
    */
    substringAfter(startChar: string): string
    
    /**
    * Returns a substring, until a char in the string is found, not including the found char
    */
    substringUntil(endChar: string): string

    /**
    * Combination of 'SubstringAfter' and 'SubstringUntil', returning a substring embedded between 'startChar and 'endChar'
    */
    stringBetween(startChar: string, endChar: string): string
}