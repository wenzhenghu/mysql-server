/*
 Copyright (c) 2013, Oracle and/or its affiliates. All rights
 reserved.
 
 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License, version 2.0,
 as published by the Free Software Foundation.

 This program is also distributed with certain software (including
 but not limited to OpenSSL) that is licensed under separate terms,
 as designated in a particular file or component or in included license
 documentation.  The authors of MySQL hereby grant you an additional
 permission to link the program and your derivative works with the
 separately licensed software that they have included with MySQL.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License, version 2.0, for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 02110-1301  USA
 */
"use strict";

var udebug = unified_debug.getLogger("integraltypes/QueryPrimaryIndexScan.js");

var t0 = new harness.ConcurrentTest('test');
t0.run = function() {
  this.pass();
};

var q1 = {p1: 4, p2: 6, expected: [4, 5, 6], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.id.ge(qdt.param('p1')).and(qdt.id.le(qdt.param('p2')));
}};

var q2 = {p1: 3, p2: 7, expected: [4, 5, 6], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.id.gt(qdt.param('p1')).and(qdt.id.lt(qdt.param('p2')));
}};

var q3 = {p1: 3, p2: 7, expected: [7], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.id.ne(qdt.param('p1')).and(qdt.id.eq(qdt.param('p2')));
}};

var q4 = {p1: 8, p2: 2, expected: [0, 1, 2, 8, 9], queryType: 2, ordered: false, 
       predicate: function(qdt) {
  return qdt.id.ge(qdt.param('p1')).or(qdt.id.le(qdt.param('p2')));
}};

var q5 = {p1: 3, p2: 7, expected: [7, 8, 9], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.id.gt(qdt.param('p1')).and(qdt.not((qdt.id.lt(qdt.param('p2')))));
}};

var q6 = {p1: 3, p2: 7, expected: [0, 1, 2, 3, 4, 5, 6, 8, 9], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.not(qdt.id.ne(qdt.param('p1')).and(qdt.id.eq(qdt.param('p2'))));
}};

var q7 = {p1: 3, p2: 7, expected: [0, 1, 2, 3, 4, 5, 6, 8, 9], queryType: 2, ordered: false, predicate: function(qdt) {
  return (qdt.id.ne(qdt.param('p1')).and(qdt.id.eq(qdt.param('p2')))).not();
}};

var q8 = {p1: 3, p2: 7, expected: [4, 5, 6, 7], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.id.gt(qdt.param('p1')).andNot((qdt.id.gt(qdt.param('p2'))));
}};

var q9 = {p1: 7, p2: 2, expected: [0, 1, 8, 9], queryType: 2, ordered: false, predicate: function(qdt) {
  return qdt.id.gt(qdt.param('p1')).orNot((qdt.id.ge(qdt.param('p2'))));
}};

var queryTests = [q1, q2, q3, q4, q5, q6, q7, q8, q9];
//var queryTests = [q1];

/***** Build and run queries ***/
var testQueries = new harness.ConcurrentTest("testQueries");
testQueries.run = function() {
  var testCase = this;
  var from = global.integraltypes;
  testCase.mappings = from;

  function onOpenSession(session) {
    var i = 0, j = 0, completedTestCount = 0, testCount = queryTests.length;

    function onExecute(err, results, queryTest) {
      testCase.errorIfNull("NoResults:q"+i+" ", results);
      if(results) {
        // check results
        // get the result ids in an array
        for (j = 0; j < results.length; ++j) {
          queryTest.resultIds[j] = results[j].id;
        }
        if (queryTest.expected.length !== results.length) {
          testCase.errorIfNotEqual('q' + i + ' wrong results: expected ' + 
              queryTest.expected + '; actual: ' + queryTest.resultIds,
              queryTest.expected.length, results.length);
        } else {
          if (!queryTest.ordered) {
            // compare results without considering order
            queryTest.resultIds.sort(function(a,b){return a-b;});
          }
          // compare the results one by one, in order
          for (j = 0; j < queryTest.expected.length; ++j) {
            udebug.log_detail('QueryPrimaryIndexScan.testQueries ' + queryTest.testName + ' expected: '
                + queryTest.expected[j] + ' actual: ' + queryTest.resultIds[j]);
            testCase.errorIfNotEqual(queryTest.testName + ' wrong result at position ' + j,
                queryTest.expected[j], queryTest.resultIds[j]);
          }
        }
      }
      if (++completedTestCount === testCount) {
        testCase.failOnError();
      }
    }

    function doQueryTest(queryTest) {
      // set up to check results
      queryTest.resultIds = [];
      ++i;
      queryTest.testName = 'q' + i;
      // each query test gets its own query domain type

      session.createQuery(from, function(err, q) {
        if (err) {
          testCase.appendErrorMessage('QueryPrimaryIndexScan.testQueries ' + 
                                       queryTest.testName + ' returned error: ' + err);
          --testCount;
          return;
        }
        q.where(queryTest.predicate(q));
        testCase.errorIfNotEqual('Wrong query type for ' + queryTest.testName,
            queryTest.queryType, q.mynode_query_domain_type.queryType);
        q.execute(queryTest, onExecute, queryTest);
      });
    }
    
    queryTests.forEach(doQueryTest);
  }

  fail_openSession(testCase, onOpenSession);
};


module.exports.tests = [testQueries];

