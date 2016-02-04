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
    console.log('got first 10 characters', chunks.join(''))
    pull(
      b, // Pass-through the rest
      pull.collect(function (err, chunks) {
        console.log('got the rest', chunks.join(''))
      })
  })
)
```

## License

ISC
