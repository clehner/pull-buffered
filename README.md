# pull-buffered

Wrap a [pull-stream](https://github.com/dominictarr/pull-stream) so that it can be read from in useful buffered ways.

### Read line by line
```js
var b = pullBuffered(source)

pull(
  b.lines(),
  pull.drain(function (line) {
    console.log('got line', line)
  })
)
```

### Read a chunk of fixed size
```js
pull(
  b.chunks(5),
  pull.drain(function (chunk) {
    console.log('got chunk of length 5', chunk)
  })
)
```

### Read as a stream of fixed size
```js
pull(
  b.take(10),
  pull.collect(function (err, chunks) {
    console.log('got the first 10 characters', chunks.join(''))
  })
)
```

### Mix and match
```js
b.lines()(null, function (end, line) {
  console.log('got first line with length', line)
  var len = parseInt(line, 10)
  b.chunks(len)(end, function (end, buf) {
    console.log('got chunk with length ' + len + ':', buf)
    pull(
      b, // Pass-through the rest
      pull.collect(function (err, chunks) {
        console.log('got the rest', chunks.join(''))
      })
    )
  })
})
```

## See also

- [pull-header](https://github.com/dominictarr/pull-header)
- [pull-reader](https://github.com/dominictarr/pull-reader)
- [pull-tobits](https://github.com/DamonOehlman/pull-tobits)

## License

ISC
