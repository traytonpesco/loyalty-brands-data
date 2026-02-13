#!/usr/bin/env python3
"""
Query and update Odoo project tasks for the loyalty/brand dashboard app.
Uses credentials from env (ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY)
or from ~/.cursor/mcp.json under mcpServers.odoo.env.
"""
import json
import os
import sys
from xmlrpc import client as xmlrpclib

def load_config():
    env = os.environ
    if env.get("ODOO_URL") and env.get("ODOO_DB") and env.get("ODOO_USERNAME") and env.get("ODOO_API_KEY"):
        return {
            "url": env["ODOO_URL"].rstrip("/"),
            "db": env["ODOO_DB"],
            "username": env["ODOO_USERNAME"],
            "password": env["ODOO_API_KEY"],
        }
    mcp_path = os.path.expanduser("~/.cursor/mcp.json")
    if os.path.isfile(mcp_path):
        with open(mcp_path) as f:
            data = json.load(f)
        servers = data.get("mcpServers") or {}
        odoo = servers.get("odoo", {})
        odoo_env = odoo.get("env", {})
        if odoo_env.get("ODOO_URL"):
            return {
                "url": odoo_env["ODOO_URL"].rstrip("/"),
                "db": odoo_env.get("ODOO_DB", ""),
                "username": odoo_env.get("ODOO_USERNAME", ""),
                "password": odoo_env.get("ODOO_API_KEY", ""),
            }
    raise SystemExit("Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY or configure ~/.cursor/mcp.json")

def main():
    cfg = load_config()
    url, db, username, password = cfg["url"], cfg["db"], cfg["username"], cfg["password"]

    common = xmlrpclib.ServerProxy(f"{url}/xmlrpc/2/common")
    uid = common.authenticate(db, username, password, {})
    if not uid:
        raise SystemExit("Odoo authentication failed")
    models = xmlrpclib.ServerProxy(f"{url}/xmlrpc/2/object")

    # Find projects with loyalty or brand in name
    project_ids = models.execute_kw(
        db, uid, password, "project.project", "search",
        [[["name", "ilike", "loyalty"]]]
    )
    if not project_ids:
        project_ids = models.execute_kw(
            db, uid, password, "project.project", "search",
            [[["name", "ilike", "brand"]]]
        )
    if not project_ids:
        # List all projects to help user
        all_projects = models.execute_kw(
            db, uid, password, "project.project", "search_read",
            [[]], {"fields": ["name", "id"], "limit": 30}
        )
        print("No project named with 'loyalty' or 'brand'. Available projects (sample):", all_projects)
        sys.exit(1)

    projects = models.execute_kw(
        db, uid, password, "project.project", "read",
        [project_ids], {"fields": ["name", "id"]}
    )
    print("Projects found:", projects)
    project_id = project_ids[0]

    # Get task stages (Done/Closed) - model may not have project_id
    stage_ids = models.execute_kw(
        db, uid, password, "project.task.type", "search_read",
        [[]], {"fields": ["name", "id", "fold"], "limit": 20}
    )
    done_stage_id = None
    for s in stage_ids:
        if s.get("fold") or (s.get("name") and "done" in s["name"].lower()):
            done_stage_id = s["id"]
            break
    if not done_stage_id and stage_ids:
        done_stage_id = stage_ids[-1]["id"]

    # Query tasks in project
    task_ids = models.execute_kw(
        db, uid, password, "project.task", "search",
        [[["project_id", "=", project_id]]], {"order": "id desc"}
    )
    tasks = models.execute_kw(
        db, uid, password, "project.task", "read",
        [task_ids], {"fields": ["name", "id", "stage_id", "description", "create_date"]}
    ) if task_ids else []
    print("\nCurrent tasks in project:")
    for t in tasks[:25]:
        print(f"  [{t['id']}] {t['name']} (stage: {t['stage_id'][0] if t.get('stage_id') else 'N/A'})")

    # Mark completed: tasks whose names suggest brand dashboard MVP work
    completed_keywords = ["brand dashboard", "brand portal", "engagement metrics", "loyalty dashboard", "fork asda", "bright.blue brand", "MVP-1", "MVP-3", "MVP-4", "Core Metrics Data", "Data Export for Brands", "Admin Panel with Brand Impersonation"]
    to_complete = [t for t in tasks if any(k in (t.get("name") or "").lower() for k in completed_keywords)]
    if done_stage_id and to_complete:
        for t in to_complete:
            try:
                models.execute_kw(db, uid, password, "project.task", "write", [[t["id"]], {"stage_id": done_stage_id}])
                print(f"  -> Marked done: {t['name']}")
            except Exception as e:
                print(f"  -> Skip {t['name']}: {e}")

    # Create new tasks for Phase 2 and remaining work
    new_tasks = [
        "Fix full db:seed (RBAC seeder validation errors)",
        "bbcloud API integration (stub exists, needs real credentials)",
        "Monthly report template (branded PDF with executive summary)",
        "Scheduled monthly report emails",
        "Brand landing page (report archive, report-first UX)",
        "Live dashboard Phase 2 (real-time bbcloud sync)",
    ]
    for name in new_tasks:
        try:
            existing = models.execute_kw(
                db, uid, password, "project.task", "search",
                [[["project_id", "=", project_id], ["name", "=", name]]]
            )
            if existing:
                print(f"  -> Task already exists: {name}")
                continue
            models.execute_kw(
                db, uid, password, "project.task", "create",
                [{"name": name, "project_id": project_id}]
            )
            print(f"  -> Created: {name}")
        except Exception as e:
            print(f"  -> Failed to create '{name}': {e}")

    print("\nDone.")

if __name__ == "__main__":
    main()
