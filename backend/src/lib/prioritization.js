/**
 * Task Prioritization Algorithm based on Deadlines and Urgency
 * 
 * Score calculation:
 * 1. Urgency Weight (Base urgency from source application):
 *    - Urgent / Critical: 100 points
 *    - High: 70 points
 *    - Medium: 40 points
 *    - Low: 15 points
 * 
 * 2. Deadline Proximity Weight (Proximity of due date to current time):
 *    - Overdue: +120 points (highest attention required)
 *    - Due Today (within 24h): +85 points
 *    - Due Tomorrow (24-48h): +60 points
 *    - Due Soon (within 7 days): +30 points
 *    - Due Later (> 7 days): +10 points
 *    - No Deadline: 0 points
 * 
 * Total Score = Urgency Weight + Deadline Weight
 * 
 * Priority Levels:
 * - P1 - Critical (Score >= 170)
 * - P2 - High (Score >= 120)
 * - P3 - Medium (Score >= 60)
 * - P4 - Low (Score < 60)
 */

function getUrgencyWeight(urgency = '') {
  const normalized = String(urgency).toLowerCase()
  if (normalized === 'urgent' || normalized === 'critical') return 100
  if (normalized === 'high') return 70
  if (normalized === 'medium') return 40
  if (normalized === 'low') return 15
  return 30
}

function getDeadlineInfo(deadline) {
  if (!deadline) {
    return {
      weight: 0,
      status: 'no_deadline',
      label: 'No deadline',
      daysRemaining: null,
    }
  }

  const now = new Date()
  const due = new Date(deadline)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays) || 1
    return {
      weight: 120,
      status: 'overdue',
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      daysRemaining: diffDays,
      isOverdue: true,
    }
  }

  // Check if due today
  const isToday = due.toDateString() === now.toDateString()
  if (isToday || diffDays <= 1) {
    return {
      weight: 85,
      status: 'due_today',
      label: 'Due today',
      daysRemaining: 0,
      isDueToday: true,
    }
  }

  if (diffDays <= 2) {
    return {
      weight: 60,
      status: 'due_soon',
      label: 'Due in 2 days',
      daysRemaining: 2,
    }
  }

  if (diffDays <= 7) {
    return {
      weight: 30,
      status: 'upcoming',
      label: `Due in ${diffDays} days`,
      daysRemaining: diffDays,
    }
  }

  return {
    weight: 10,
    status: 'later',
    label: `Due in ${diffDays} days`,
    daysRemaining: diffDays,
  }
}

function calculatePriority(task) {
  const urgencyWeight = getUrgencyWeight(task.urgency)
  const deadlineInfo = getDeadlineInfo(task.deadline)

  // Extra boost if task is pending or open vs completed
  const isCompleted = ['completed', 'resolved', 'done'].includes(String(task.status).toLowerCase())
  const statusMultiplier = isCompleted ? 0.2 : 1.0

  const rawScore = urgencyWeight + deadlineInfo.weight
  const score = Math.round(rawScore * statusMultiplier)

  let level = 'P4 - Low'
  let tone = 'low'

  if (score >= 170) {
    level = 'P1 - Critical'
    tone = 'critical'
  } else if (score >= 120) {
    level = 'P2 - High'
    tone = 'high'
  } else if (score >= 60) {
    level = 'P3 - Medium'
    tone = 'medium'
  }

  return {
    score,
    level,
    tone,
    urgencyWeight,
    deadlineWeight: deadlineInfo.weight,
    deadlineStatus: deadlineInfo.status,
    deadlineLabel: deadlineInfo.label,
    daysRemaining: deadlineInfo.daysRemaining,
    isOverdue: Boolean(deadlineInfo.isOverdue),
    isDueToday: Boolean(deadlineInfo.isDueToday),
  }
}

module.exports = {
  calculatePriority,
  getUrgencyWeight,
  getDeadlineInfo,
}
