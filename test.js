var buffered = require('.')
var tape = require('tape')
var pull = require('pull-stream')

function testMulti(t, str, test) {
  function test2(name, strs) {
    t.test(name, function (t) {
      t.test('string stream', function (t) {
        var b = buffered()
        pull(pull.values(strs), b)
        test(t, b)
      })
      t.test('buffer stream', function (t) {
        var b = buffered()
        pull(pull.values(strs.map(Buffer)), b)
        test(t, b)
      })
      t.end()
    })
  }

  test2('read all at once', [str])
  test2('read character by character', str.split(''))
}

tape('get lines', function (t) {
  var lines = ['abcdef', 'foobar', 'stuff']
  testMulti(t, lines.join('\n'), function (t, b) {
    pull(
      b.lines(),
      pull.collect(function (err, theLines) {
        t.error(err, 'no collect error')
        t.deepEqual(theLines, lines, 'got same lines')
        t.end()
      })
    )
  })
})

tape('get words', function (t) {
  var lines = ['apple', 'pie', 'house']
  testMulti(t, lines.join(' '), function (t, b) {
    pull(
      b.delimited(' '),
      pull.collect(function (err, theLines) {
        t.error(err, 'no collect error')
        t.deepEqual(theLines, lines, 'got same words')
        t.end()
      })
    )
  })
})

function join(things) {
  return Buffer.isBuffer(things[0])
    ? Buffer.concat(things).toString('ascii')
    : things.join('')
}

tape('get data', function (t) {
  var str = 'abcdefaoidjfaosdf\naosdifjasdfo\nbadoia'
  testMulti(t, str, function (t, b) {
    pull(
      b.passthrough,
      pull.collect(function (err, bufs) {
        t.error(err, 'no collect error')
        t.equal(join(bufs), str, 'got same data')
        t.end()
      })
    )
  })
})

tape('get data after lines', function (t) {
  var lines = ['abcdef', 'foobar', 'stuff\nthing']
  testMulti(t, lines.join('\n'), function (t, b) {

    // read the first two lines
    var readLine = b.lines()
    readLine(null, function (end, line) {
      t.error(end, 'stream not ended')
      t.equal(line, lines[0], 'first line')
      readLine(null, function (end, line) {
        t.error(end, 'stream not ended')
        t.equal(line, lines[1], 'second line')

        // pass through the rest
        pull(
          b.passthrough,
          pull.collect(function (err, bufs) {
            t.equal(join(bufs), lines[2], 'got the rest as data')
            t.end()
          })
        )
      })
    })
  })
})

tape('get chunks of fixed length', function (t) {
  var chunks = ['1234', '5678', 'abcd', '----']
  var chunksStr = chunks.join('')
  testMulti(t, chunksStr, function (t, b) {
    pull(
      b.chunks(4),
      pull.collect(function (err, theChunks) {
        t.error(err, 'no collect error')
        t.deepEqual(theChunks.map(String), chunks, 'got the chunks')
        t.end()
      })
    )
  })
})

tape('get stream of fixed length', function (t) {
  var chunks = ['aaaaabbbbbccccc', 'morethings', 'foobarstuff']
  var chunksStr = chunks.join('')
  testMulti(t, chunksStr, function (t, b) {
    pull(
      b.take(chunks[0].length),
      pull.collect(function (err, subchunks) {
        t.error(err, 'no collect error')
        t.equal(join(subchunks), chunks[0], 'got first chunk')
        // get another
        pull(
          b.take(chunks[1].length),
          pull.collect(function (err, subchunks) {
            t.error(err, 'no collect error')
            t.equal(join(subchunks), chunks[1], 'got second chunk')
            // pass through the rest
            pull(
              b.passthrough,
              pull.collect(function (err, subchunks) {
                t.error(err, 'no collect error')
                t.equal(join(subchunks), chunks[2], 'got the rest')
                t.end()
              })
            )
          })
        )
      })
    )
  })
})
