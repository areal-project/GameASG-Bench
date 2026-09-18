'use strict';

const NOT_APPLICABLE = 'NOT_APPLICABLE';

function summarizeResults(results, levelOrder = ['P0', 'P1', 'P2']) {
  const summary = {};

  for (const level of levelOrder) {
    const levelResults = results.filter(result => result.level === level);
    if (levelResults.length === 0) continue;

    const key = level.toLowerCase();
    const applicable = levelResults.filter(result => result.status !== NOT_APPLICABLE);
    const notApplicable = levelResults.length - applicable.length;

    summary[`${key}_pass`] = applicable.filter(result => result.status === 'PASS').length;
    summary[`${key}_total`] = applicable.length;
    summary[`${key}_configured_total`] = levelResults.length;
    summary[`${key}_not_applicable`] = notApplicable;
  }

  const applicableResults = results.filter(result => result.status !== NOT_APPLICABLE);
  const totalPass = applicableResults.filter(result => result.status === 'PASS').length;
  const notApplicable = results.length - applicableResults.length;

  summary.configured_total = results.length;
  summary.applicable_total = applicableResults.length;
  summary.not_applicable = notApplicable;

  return {
    summary,
    totalPass,
    configuredCount: results.length,
    applicableCount: applicableResults.length,
    notApplicable,
    allGreen: totalPass === applicableResults.length
  };
}

module.exports = { NOT_APPLICABLE, summarizeResults };
