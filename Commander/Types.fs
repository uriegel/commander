module Types

type Empty = { Nil: int }
type JsonResult<'a, 'b> = { Ok: 'a option; Err: 'b option }