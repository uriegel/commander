module Types

type JsonResult<'a, 'b> = { Ok: 'a option; Err: 'b option }