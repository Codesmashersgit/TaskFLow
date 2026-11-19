const crypto = require('crypto')
const { getPool } = require('./connect')

function id() {
  return crypto.randomUUID()
}

function taskShape(row) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    owner: row.owner_id,
    createdBy: row.created_by_id,
    project: row.project_id,
    assignee: row.assignee_id ? { _id: row.assignee_id, id: row.assignee_id, name: row.assignee_name, email: row.assignee_email } : null,
    parentTask: row.parent_task_id,
    labels: row.labels || [],
    checklist: row.checklist || [],
    comments: row.comments || [],
    activity: row.activity || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function projectShape(row) {
  if (!row) return null
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    owner: row.owner_id ? { _id: row.owner_id, id: row.owner_id, name: row.owner_name, email: row.owner_email } : row.owner_id,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    color: row.color,
    members: row.members || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const repository = {
  async findUserByEmail(email) {
    const { rows } = await getPool().query('SELECT id,name,email,password_hash,avatar,role,status,email_notifications,in_app_notifications FROM users WHERE email=$1', [email])
    const row = rows[0]
    return row ? { id: row.id, _id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash, avatar: row.avatar, role: row.role, status: row.status, preferences: { emailNotifications: row.email_notifications, inAppNotifications: row.in_app_notifications } } : null
  },
  async findUserById(userId) {
    const { rows } = await getPool().query('SELECT id,name,email,password_hash,avatar,role,status,email_notifications,in_app_notifications FROM users WHERE id=$1', [userId])
    const row = rows[0]
    return row ? { id: row.id, _id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash, avatar: row.avatar, role: row.role, status: row.status, preferences: { emailNotifications: row.email_notifications, inAppNotifications: row.in_app_notifications } } : null
  },
  async createUser({ name, email, passwordHash }) {
    const userId = id()
    const count = await getPool().query('SELECT COUNT(*)::int count FROM users')
    const role = count.rows[0].count === 0 ? 'admin' : 'employee'
    await getPool().query('INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)', [userId, name, email, passwordHash, role])
    return this.findUserById(userId)
  },
  async updateUser(userId, updates) {
    const fields = []
    const values = []
    if (updates.name) { fields.push(`name=$${fields.length + 1}`); values.push(updates.name) }
    if (updates.preferences?.emailNotifications !== undefined) { fields.push(`email_notifications=$${fields.length + 1}`); values.push(updates.preferences.emailNotifications) }
    if (updates.preferences?.inAppNotifications !== undefined) { fields.push(`in_app_notifications=$${fields.length + 1}`); values.push(updates.preferences.inAppNotifications) }
    if (!fields.length) return this.findUserById(userId)
    fields.push(`updated_at=NOW()`)
    values.push(userId)
    await getPool().query(`UPDATE users SET ${fields.join(',')} WHERE id=$${values.length}`, values)
    return this.findUserById(userId)
  },
  async createEmployee({ name, email, passwordHash }) {
    const userId = id()
    await getPool().query("INSERT INTO users(id,name,email,password_hash,role,status) VALUES($1,$2,$3,$4,'employee','active')", [userId, name, email, passwordHash])
    return this.findUserById(userId)
  },
  async listTeam() {
    const { rows } = await getPool().query(`
      SELECT u.id,u.name,u.email,u.role,u.status,u.created_at,
        COUNT(DISTINCT t.id)::int total_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status='Done')::int completed_tasks,
        COUNT(DISTINCT t.id) FILTER (WHERE t.assignee_id=u.id AND t.status<> 'Done')::int open_tasks
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id=u.id
      GROUP BY u.id,u.name,u.email,u.role,u.status,u.created_at
      ORDER BY u.created_at ASC`)
    return rows.map((row) => ({
      id: row.id, _id: row.id, name: row.name, email: row.email, role: row.role, status: row.status,
      createdAt: row.created_at, stats: { total: row.total_tasks, completed: row.completed_tasks, open: row.open_tasks },
    }))
  },
  async setTeamMemberRole(userId, role) {
    await getPool().query('UPDATE users SET role=$1,updated_at=NOW() WHERE id=$2', [role, userId])
    return this.findUserById(userId)
  },
  async setTeamMemberStatus(userId, status) {
    await getPool().query('UPDATE users SET status=$1,updated_at=NOW() WHERE id=$2', [status, userId])
    return this.findUserById(userId)
  },
  async findProjectsForUser(userId, status = 'active') {
    const { rows } = await getPool().query(`
      SELECT p.*, o.name owner_name,o.email owner_email,
        COALESCE(json_agg(json_build_object('user',json_build_object('_id',u.id,'id',u.id,'name',u.name,'email',u.email),'role',pm.role,'joinedAt',pm.joined_at)) FILTER (WHERE u.id IS NOT NULL),'[]') members
      FROM projects p
      JOIN project_members me ON me.project_id=p.id AND me.user_id=$1
      JOIN users o ON o.id=p.owner_id
      LEFT JOIN project_members pm ON pm.project_id=p.id
      LEFT JOIN users u ON u.id=pm.user_id
      WHERE p.status=$2
      GROUP BY p.id,o.name,o.email
      ORDER BY p.updated_at DESC`, [userId, status])
    const shaped = rows.map(projectShape)
    for (const project of shaped) {
      const counts = await getPool().query("SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE status='Done')::int completed FROM tasks WHERE project_id=$1", [project.id])
      project.stats = counts.rows[0]
    }
    return shaped
  },
  async findProject(projectId, userId) {
    const { rows } = await getPool().query(`
      SELECT p.*,o.name owner_name,o.email owner_email,
        COALESCE(json_agg(json_build_object('user',json_build_object('_id',u.id,'id',u.id,'name',u.name,'email',u.email),'role',pm.role,'joinedAt',pm.joined_at)) FILTER (WHERE u.id IS NOT NULL),'[]') members
      FROM projects p JOIN project_members me ON me.project_id=p.id AND me.user_id=$2
      JOIN users o ON o.id=p.owner_id
      LEFT JOIN project_members pm ON pm.project_id=p.id LEFT JOIN users u ON u.id=pm.user_id
      WHERE p.id=$1 GROUP BY p.id,o.name,o.email`, [projectId, userId])
    return projectShape(rows[0])
  },
  async createProject(fields, userId) {
    const projectId = id()
    await getPool().query('BEGIN')
    try {
      await getPool().query(`INSERT INTO projects(id,name,description,owner_id,priority,due_date,color) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [projectId, fields.name, fields.description || '', userId, fields.priority || 'Medium', fields.dueDate || null, fields.color || 'violet'])
      await getPool().query("INSERT INTO project_members(project_id,user_id,role) VALUES($1,$2,'owner')", [projectId, userId])
      await getPool().query('COMMIT')
    } catch (error) { await getPool().query('ROLLBACK'); throw error }
    return this.findProject(projectId, userId)
  },
  async updateProject(projectId, userId, fields) {
    const allowed = { name: 'name', description: 'description', priority: 'priority', dueDate: 'due_date', color: 'color', status: 'status' }
    const sets = []
    const values = []
    for (const [key, column] of Object.entries(allowed)) if (Object.hasOwn(fields, key)) { values.push(fields[key]); sets.push(`${column}=$${values.length}`) }
    if (!sets.length) return this.findProject(projectId, userId)
    values.push(projectId)
    await getPool().query(`UPDATE projects SET ${sets.join(',')},updated_at=NOW() WHERE id=$${values.length}`, values)
    return this.findProject(projectId, userId)
  },
  async archiveProject(projectId) {
    await getPool().query("UPDATE projects SET status='archived',updated_at=NOW() WHERE id=$1", [projectId])
  },
  async addProjectMember(projectId, userId) {
    await getPool().query("INSERT INTO project_members(project_id,user_id,role) VALUES($1,$2,'member') ON CONFLICT DO NOTHING", [projectId, userId])
  },
  async removeProjectMember(projectId, userId) {
    await getPool().query('DELETE FROM project_members WHERE project_id=$1 AND user_id=$2', [projectId, userId])
  },
  async projectStats(userId) {
    const { rows } = await getPool().query(`
      SELECT
        COUNT(t.id)::int total,
        COUNT(t.id) FILTER (WHERE t.status='Done')::int completed,
        COUNT(t.id) FILTER (WHERE t.status IN ('In Progress','In Review'))::int "inProgress",
        COUNT(t.id) FILTER (WHERE t.status<> 'Done' AND t.due_date < date_trunc('day',NOW()))::int overdue,
        COUNT(t.id) FILTER (WHERE t.assignee_id=$1)::int assigned
      FROM tasks t JOIN project_members pm ON pm.project_id=t.project_id AND pm.user_id=$1
      JOIN projects p ON p.id=t.project_id AND p.status='active'`, [userId])
    const projectCount = await getPool().query("SELECT COUNT(*)::int count FROM project_members pm JOIN projects p ON p.id=pm.project_id WHERE pm.user_id=$1 AND p.status='active'", [userId])
    const row = rows[0]
    return { ...row, pending: row.total - row.completed - row.inProgress, projectCount: projectCount.rows[0].count }
  },
  async personalTaskStats(userId) {
    const { rows } = await getPool().query(`
      SELECT COUNT(*)::int total,COUNT(*) FILTER (WHERE status='Done')::int completed,
      COUNT(*) FILTER (WHERE status='In Progress')::int "inProgress",
      COUNT(*) FILTER (WHERE status<> 'Done' AND due_date < date_trunc('day',NOW()))::int overdue
      FROM tasks WHERE (owner_id=$1 OR assignee_id=$1)`, [userId])
    const row = rows[0]
    return { ...row, pending: row.total - row.completed - row.inProgress }
  },
  async personalTasks(userId, { status, priority, search, sort, direction }) {
    const conditions = ['(t.owner_id=$1 OR t.assignee_id=$1)']
    const values = [userId]
    if (status && status !== 'All') { values.push(status); conditions.push(`t.status=$${values.length}`) }
    if (priority && priority !== 'All') { values.push(priority); conditions.push(`t.priority=$${values.length}`) }
    if (search) { values.push(`%${search}%`); conditions.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`) }
    const order = sort === 'priority' ? "CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END" : `t.${sort === 'dueDate' ? 'due_date' : sort === 'updatedAt' ? 'updated_at' : 'created_at'}`
    const { rows } = await getPool().query(`
      SELECT t.*,a.name assignee_name,a.email assignee_email FROM tasks t LEFT JOIN users a ON a.id=t.assignee_id
      WHERE ${conditions.join(' AND ')} ORDER BY ${order} ${direction === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`, values)
    return rows.map(taskShape)
  },
  async projectTasks(projectId, { status, priority, assignee, search, sort, direction }) {
    const conditions = ['t.project_id=$1']
    const values = [projectId]
    if (status && status !== 'All') { values.push(status); conditions.push(`t.status=$${values.length}`) }
    if (priority && priority !== 'All') { values.push(priority); conditions.push(`t.priority=$${values.length}`) }
    if (assignee && assignee !== 'All') { if (assignee === 'unassigned') conditions.push('t.assignee_id IS NULL'); else { values.push(assignee); conditions.push(`t.assignee_id=$${values.length}`) } }
    if (search) { values.push(`%${search}%`); conditions.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length} OR EXISTS (SELECT 1 FROM unnest(t.labels) label WHERE label ILIKE $${values.length}))`) }
    const order = sort === 'priority' ? "CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END" : `t.${sort === 'dueDate' ? 'due_date' : sort === 'updatedAt' ? 'updated_at' : 'created_at'}`
    const { rows } = await getPool().query(`
      SELECT t.*,a.name assignee_name,a.email assignee_email FROM tasks t LEFT JOIN users a ON a.id=t.assignee_id
      WHERE ${conditions.join(' AND ')} ORDER BY ${order} ${direction === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`, values)
    return rows.map(taskShape)
  },
  async findTask(taskId, projectId) {
    const conditions = ['t.id=$1']; const values = [taskId]
    if (projectId) { values.push(projectId); conditions.push(`t.project_id=$${values.length}`) }
    const { rows } = await getPool().query(`SELECT t.*,a.name assignee_name,a.email assignee_email FROM tasks t LEFT JOIN users a ON a.id=t.assignee_id WHERE ${conditions.join(' AND ')}`, values)
    return taskShape(rows[0])
  },
  async createTask(fields, projectId, ownerId) {
    const taskId = id()
    await getPool().query(`INSERT INTO tasks(id,title,description,status,priority,due_date,owner_id,created_by_id,project_id,assignee_id,parent_task_id,labels,checklist,activity)
      VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13)`,
      [taskId, fields.title, fields.description || '', fields.status || 'Todo', fields.priority || 'Medium', fields.dueDate || null, ownerId, projectId || null, fields.assignee || null, fields.parentTask || null, fields.labels || [], JSON.stringify(fields.checklist || []), JSON.stringify([{ actor: ownerId, actorName: 'Member', action: 'created this task', detail: '', createdAt: new Date().toISOString() }])])
    return this.findTask(taskId, projectId)
  },
  async updateTask(taskId, projectId, fields) {
    const allowed = { title:'title', description:'description', status:'status', priority:'priority', dueDate:'due_date', assignee:'assignee_id', parentTask:'parent_task_id', labels:'labels', checklist:'checklist' }
    const sets=[]; const values=[]
    for (const [key,column] of Object.entries(allowed)) if (Object.hasOwn(fields,key)) {
      let value=fields[key]
      if (key === 'labels') value=value
      if (key === 'checklist') value=JSON.stringify(value)
      values.push(value); sets.push(`${column}=$${values.length}`)
    }
    if (!sets.length) return this.findTask(taskId, projectId)
    values.push(taskId)
    let query
    if (projectId) {
      values.push(projectId)
      query = `UPDATE tasks SET ${sets.join(',')},updated_at=NOW() WHERE id=$${values.length - 1} AND project_id=$${values.length}`
    } else {
      query = `UPDATE tasks SET ${sets.join(',')},updated_at=NOW() WHERE id=$${values.length}`
    }
    await getPool().query(query, values)
    return this.findTask(taskId, projectId)
  },
  async deleteTask(taskId, projectId) {
    await getPool().query(projectId ? 'DELETE FROM tasks WHERE id=$1 AND project_id=$2' : 'DELETE FROM tasks WHERE id=$1', projectId ? [taskId,projectId] : [taskId])
  },
  async addComment(taskId, projectId, userId, userName, body) {
    const comment={ _id:id(), author:userId, authorName:userName, body, createdAt:new Date().toISOString() }
    const activity={ _id:id(), actor:userId, actorName:userName, action:'left a comment', detail:'', createdAt:new Date().toISOString() }
    await getPool().query(`UPDATE tasks SET comments=comments||$1::jsonb,activity=activity||$2::jsonb,updated_at=NOW() WHERE id=$3 AND project_id=$4`,
      [JSON.stringify([comment]),JSON.stringify([activity]),taskId,projectId])
    return { comment, activity }
  },
  async createNotification({ userId, actorId, projectId, taskId, message }) {
    await getPool().query(`INSERT INTO notifications(user_id,actor_id,project_id,task_id,message) VALUES($1,$2,$3,$4,$5)`,
      [userId,actorId||null,projectId||null,taskId||null,message])
  },
  async notifications(userId) {
    const { rows }=await getPool().query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30',[userId])
    return rows.map(row=>({_id:row.id,id:row.id,actor:row.actor_id,project:row.project_id,task:row.task_id,message:row.message,readAt:row.read_at,createdAt:row.created_at}))
  },
  async markNotificationsRead(userId) {
    await getPool().query('UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL',[userId])
  },
}

module.exports = { repository, taskShape, projectShape }
