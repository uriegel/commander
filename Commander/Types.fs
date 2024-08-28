module Types

type JsonResult<'a, 'b> = { Ok: 'a option; Error: 'b option }