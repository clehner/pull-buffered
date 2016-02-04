var buffered = require('.')
var tape = require('tape')
var pull = require('pull-stream')

function testMulti(t, str, test) {
  function test2(name, strs) {
    t.test(name, function (t) {
      t.test('string stream', function (t) {
        test(t, buffered(pull.values(strs)))
      })
      t.test('buffer stream', function (t) {
        test(t, buffered(pull.values(strs.map(Buffer))))
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

function join(things) {
  return Buffer.isBuffer(things[0])
    ? Buffer.concat(things).toString('ascii')
    : things.join('')
}

tape('get data', function (t) {
  var str = 'abcdefaoidjfaosdf\naosdifjasdfo\nbadoia'
  testMulti(t, str, function (t, b) {
    pull(
      b,
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
          b,
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
