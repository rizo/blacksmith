/*
 * content-test.js: Tests for rendering individual content files (i.e. Markdown + metadata) 
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    utile = require('flatiron').common,
    async = utile.async,
    content = require('../lib/blacksmith/content');

var blogDir = path.join(__dirname, 'fixtures', 'blog');

vows.describe('blacksmith/content').addBatch({
  "Using the content module": {
    "the render() method": {
      "with a .md file": {
        "with no marked options": {
          topic: function () {
            content.render(
              path.join(blogDir, 'content', 'posts', 'a-post.md'),
              this.callback
            );
          },
          "should respond with no error": function (err, result) {
            assert.isNull(err);
            assert.isObject(result);
          },
          "should respond with raw markdown": function (err, result) {
            assert.isObject(result);
            assert.isString(result.markdown);
          },
          "should respond with html": function (err, result) {
            assert.isObject(result);
            assert.isString(result.html);
          },
          "should respond with metadata": function (err, result) {
            assert.isObject(result);
            assert.isObject(result.metadata);
            assert.equal(result.metadata.author, 'Charlie Robbins');
            assert.isObject(result.metadata.nested);
            assert.equal(result.metadata.nested.key, 'Metadata value');
            
          }
        }
      },
      "with an .html file": {
        topic: function () {
          content.render(
            path.join(blogDir, 'content', 'wtf.html'),
            this.callback
          );
        },
        "should respond with the appropriate error": function (err, _) {
          assert.isObject(err);
          assert.equal(err.message, 'Invalid content extention: .html');
        }
      }
    },
    "the addSnippets() method": {
      topic: function () {
        var postDir = path.join(blogDir, 'content', 'posts', 'dir-post'),
            that = this;
        
        async.parallel({
          'index':    async.apply(fs.readFile, path.join(postDir, 'index.markdown'), 'utf8'),
          'file1.js': async.apply(fs.readFile, path.join(postDir, 'file1.js'), 'utf8'),
          'file2.js': async.apply(fs.readFile, path.join(postDir, 'file2.js'), 'utf8')
        }, function (err, files) {
          if (err) {
            return that.callback(err);
          }
          
          content.addSnippets({
            source: files.index,
            dir: postDir,
            files: ['file1.js', 'file2.js']
          }, function (err, source) {
            return err ? that.callback(err) : that.callback(null, {
              source: source,
              files: files
            }); 
          });
        });
      },
      "should insert both files": function (err, results) {
        assert.isNull(err);
        assert.isString(results.source);
        
        ['file1.js', 'file2.js'].forEach(function (file) {
          assert.isTrue(results.source.indexOf([
            '``` js',
            results.files[file],
            '```'
          ].join('\n')) !== -1);
        });        
      }
    }
  }
}).export(module);
