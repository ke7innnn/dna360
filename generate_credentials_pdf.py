import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class PDFReport(FPDF):
    def header(self):
        # Top banner background (Dark luxury navy/slate)
        self.set_fill_color(11, 15, 25)
        self.rect(0, 0, 210, 32, 'F')
        
        # Top accent line (Electric Blue)
        self.set_fill_color(59, 130, 246)
        self.rect(0, 0, 210, 2.5, 'F')
        
        # Brand title
        self.set_font('Helvetica', 'B', 15)
        self.set_text_color(245, 242, 244)
        self.set_xy(12, 8)
        self.cell(0, 8, 'DNA 360  |  ACCESS CONTROL & CREDENTIALS DIRECTORY', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Subtitle
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(139, 134, 144)
        self.set_xy(12, 18)
        self.cell(140, 6, 'Powai Flagship - Single-Club RBAC & Member Portal Directory v1.0', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(59, 130, 246)
        self.set_xy(150, 18)
        self.cell(48, 6, 'CONFIDENTIAL', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_draw_color(220, 225, 235)
        self.line(12, self.get_y(), 198, self.get_y())
        self.set_font('Helvetica', '', 8)
        self.set_text_color(120, 125, 135)
        self.set_y(-12)
        self.cell(0, 6, f'DNA 360 Fitness Management - Single Club RBAC - Page {self.page_no()}', align='C')

def create_pdf(output_path):
    pdf = PDFReport(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    
    # ─── SECTION 1: GLOBAL AUTH OVERVIEW ───
    pdf.set_y(36)
    pdf.set_fill_color(240, 245, 255)
    pdf.set_draw_color(190, 215, 255)
    pdf.rect(12, pdf.get_y(), 186, 26, 'FD')
    
    pdf.set_xy(16, pdf.get_y() + 2.5)
    pdf.set_font('Helvetica', 'B', 10.5)
    pdf.set_text_color(29, 78, 216)
    pdf.cell(0, 6, 'Global Authentication & System Parameters', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(40, 45, 55)
    pdf.set_x(16)
    pdf.cell(58, 5, '* Standard Staff Password: password123', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(58, 5, '* Global Phone OTP Code: 123456', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(58, 5, '* 2FA TOTP Demo Code: 123456', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(16)
    pdf.cell(90, 5, '* Login Portal URL: /login (Dual Email/Password & Phone OTP)', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(80, 5, '* Active Club: Hiranandani Gardens, Powai (400076)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(5)
    
    # ─── SECTION 2: EXECUTIVE & REVENUE LEADERSHIP ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, '1. Executive & Revenue Leadership (Full Access & Revenue Wall)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 4, 'These 4 roles have access to the Financial Revenue Wall and require 2FA TOTP authentication.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    # Table Header
    headers = ['Name', 'Role', 'Login Email', 'Phone Number', 'Password', '2FA TOTP', 'Access Scope']
    widths = [28, 28, 42, 26, 20, 16, 26]
    
    pdf.set_fill_color(30, 41, 59)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 7.5)
    for i, h in enumerate(headers):
        pdf.cell(widths[i], 6.5, h, border=1, align='C', fill=True)
    pdf.ln()
    
    # Table Data
    rev_data = [
        ['Executive Admin', 'Owner / Executive', 'admin@dna360.in', '+919820011111', 'password123', '123456', 'All Financials, Full Admin'],
        ['Keith Shah', 'Administrator', 'keith.mktg@dna360.in', '+919820021002', 'password123', '123456', 'Full Admin Access (All Features)'],
        ['Swapnil Borhade', 'HR Head', 'swapnil.hr@dna360.in', '+919820021001', 'password123', '123456', 'People, Staff, Audit, Revenue'],
        ['Monica Picholla', 'Asst. Sales Head', 'monica.sales@dna360.in', '+919820021003', 'password123', '123456', 'Invoices, Memberships, Revenue'],
    ]
    
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(20, 25, 35)
    for row_idx, row in enumerate(rev_data):
        fill = row_idx % 2 == 1
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        for i, val in enumerate(row):
            align = 'C' if i in [3, 4, 5] else 'L'
            pdf.cell(widths[i], 6, val, border=1, align=align, fill=fill)
        pdf.ln()
        
    pdf.ln(5)
    
    # ─── SECTION 3: TRAINING & STUDIO DEPARTMENT ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, '2. Training & Studio Department (Classes & Scoped PT Rosters)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 4, 'Trainers are strictly blinded to revenue. General trainers can view & log sessions for assigned PT clients only.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    trainer_headers = ['Name', 'Role', 'Login Email', 'Phone Number', 'Password', 'Assigned Scope']
    trainer_widths = [32, 28, 44, 28, 20, 34]
    
    pdf.set_fill_color(30, 41, 59)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 7.5)
    for i, h in enumerate(trainer_headers):
        pdf.cell(trainer_widths[i], 6.5, h, border=1, align='C', fill=True)
    pdf.ln()
    
    trainers = [
        ['Rajesh Poojary', 'Head Trainer', 'rajesh.coach@dna360.in', '+919820041001', 'password123', 'All Studios, Trainers & Classes'],
        ['Aftab Memon', 'Head Trainer', 'aftab.coach@dna360.in', '+919820041002', 'password123', 'All Studios, Trainers & Classes'],
        ['Pramod Sawant', 'General Trainer', 'pramod.trainer@dna360.in', '+919820041003', 'password123', 'Arjun Mehta, Priya Sharma'],
        ['Jateen Gaonkar', 'General Trainer', 'jateen.trainer@dna360.in', '+919820041004', 'password123', 'Rohan Deshmukh, Neha Kulkarni'],
        ['Aditya Sarmalkar', 'General Trainer', 'aditya.trainer@dna360.in', '+919820041005', 'password123', 'Siddharth Kapoor'],
        ['Vaibhav Gawade', 'General Trainer', 'vaibhav.trainer@dna360.in', '+919820041006', 'password123', 'Ananya Patel, Rahul Verma'],
        ['Mohd Hussain Ansari', 'General Trainer', 'hussain.trainer@dna360.in', '+919820041007', 'password123', 'Pooja Nair'],
    ]
    
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(20, 25, 35)
    for row_idx, row in enumerate(trainers):
        fill = row_idx % 2 == 1
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        for i, val in enumerate(row):
            align = 'C' if i in [3, 4] else 'L'
            pdf.cell(trainer_widths[i], 5.8, val, border=1, align=align, fill=fill)
        pdf.ln()

    pdf.ln(5)
    
    # ─── SECTION 4: SALES FLOOR & CONSULTANTS ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, '3. Sales Floor & Fitness Consultants (Lead CRM & Enrollments)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    consultant_headers = ['Name', 'Role', 'Login Email', 'Phone Number', 'Password', 'Functional Scope']
    consultant_widths = [32, 30, 42, 28, 20, 34]
    
    pdf.set_fill_color(30, 41, 59)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 7.5)
    for i, h in enumerate(consultant_headers):
        pdf.cell(consultant_widths[i], 6.5, h, border=1, align='C', fill=True)
    pdf.ln()
    
    consultants = [
        ['Pallavi', 'Fitness Consultant', 'pallavi.fc@dna360.in', '+919820031001', 'password123', 'Walk-in Leads, Enrollments'],
        ['Nisha Yadav', 'Fitness Consultant', 'nisha.fc@dna360.in', '+919820031002', 'password123', 'Walk-in Leads, Enrollments'],
        ['Surendra Chaudhary', 'Fitness Consultant', 'surendra.fc@dna360.in', '+919820031003', 'password123', 'Walk-in Leads, Enrollments'],
        ['Krish Rawat', 'Fitness Consultant', 'krish.fc@dna360.in', '+919820031004', 'password123', 'Walk-in Leads, Enrollments'],
        ['Liladhar Mestry', 'Masseur', 'liladhar.masseur@dna360.in', '+919820051001', 'password123', 'Spa & Therapy Appointments'],
        ['Suresh Jivanvar', 'Supervisor', 'suresh.sup@dna360.in', '+919820051002', 'password123', 'Turnstile & Floor Access Ops'],
    ]
    
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(20, 25, 35)
    for row_idx, row in enumerate(consultants):
        fill = row_idx % 2 == 1
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        for i, val in enumerate(row):
            align = 'C' if i in [3, 4] else 'L'
            pdf.cell(consultant_widths[i], 5.8, val, border=1, align=align, fill=fill)
        pdf.ln()

    # ─── PAGE 2: CLIENT PORTAL & 659 MEMBERS DIRECTORY ───
    pdf.add_page()
    pdf.set_y(36)
    
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, '4. Member Portal & Real Clients (659 Verified Gymex Profiles)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(60, 65, 75)
    pdf.multi_cell(186, 4.5, 'All 659 registered Gymex members have seamless access to the self-service Member Portal (/dashboard). Members authenticate using their registered mobile number with SMS/WhatsApp OTP (123456) or password123. The turnstile token engine gates access based on membership status.')
    pdf.ln(3)
    
    member_headers = ['Member Code', 'Client Name', 'Registered Mobile', 'Package / Plan', 'Membership Status', 'Gate Access']
    member_widths = [26, 32, 28, 48, 26, 26]
    
    pdf.set_fill_color(30, 41, 59)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 7.5)
    for i, h in enumerate(member_headers):
        pdf.cell(member_widths[i], 6.5, h, border=1, align='C', fill=True)
    pdf.ln()
    
    sample_members = [
        ['DNA-2025-0001', 'Arjun Mehta', '+919820010001', 'Annual Gym Membership Package 1', 'ACTIVE', 'Turnstile ONLINE'],
        ['DNA-2025-0002', 'Priya Sharma', '+919820010002', '6-Month Fitness Plus', 'ACTIVE', 'Turnstile ONLINE'],
        ['DNA-2025-0003', 'Vikram Singhania', '+919820010003', 'Annual Happy Hours Gym Membership', 'ACTIVE', 'Turnstile ONLINE'],
        ['DNA-2025-0004', 'Rohan Deshmukh', '+919820010004', 'Reformer Pilates - 36 Sessions', 'ACTIVE', 'Turnstile ONLINE'],
        ['DNA-2025-0005', 'Neha Kulkarni', '+919820010005', 'Tier 1 PT - 12 Sessions (1 Month)', 'ACTIVE', 'Turnstile ONLINE'],
        ['DNA-2025-0016', 'Karan Kapoor', '+919820010016', 'Annual Gym - All Activities', 'GRACE PERIOD', 'Turnstile ONLINE (7d)'],
        ['DNA-2025-0034', 'Tanvi Nair', '+919820010034', 'Reformer Pilates - 36 Sessions', 'EXPIRED', 'Turnstile BLOCKED'],
        ['DNA-2025-0001..659', 'All 659 Clients', '+9198200XXXXX', 'Gym + PT + Reformer Plans', '659 Live Records', 'Status-Gated Token'],
    ]
    
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(20, 25, 35)
    for row_idx, row in enumerate(sample_members):
        fill = row_idx % 2 == 1
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        for i, val in enumerate(row):
            align = 'C' if i in [0, 2, 4, 5] else 'L'
            pdf.cell(member_widths[i], 5.8, val, border=1, align=align, fill=fill)
        pdf.ln()

    pdf.ln(5)

    # ─── SECTION 5: ROLE CAPABILITY MATRIX SUMMARY ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, '5. Single-Club v1 Role Permissions & Access Rules', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)
    
    rules = [
        ('The Revenue Wall', 'Only Owner, HR Head, Marketing Head, and Sales Head have revenue.view capability. All other 30 staff members are strictly blinded to financials, MRR, collections, and GST figures.'),
        ('IDOR Protection', 'Trainers can view and log workouts exclusively for members explicitly assigned in their activeClientIds roster. Scoped capability members.view.own enforced on both server and client.'),
        ('Member Self-Service', 'Members have zero access to the admin console. The rolling 30-second QR turnstile token is dynamically minted only for members with active or grace-period status.'),
        ('Audit Logging', 'All login events, role capability alterations, price overrides, and membership status mutations are logged with timestamp, user ID, IP address, and role signature.')
    ]
    
    pdf.set_fill_color(245, 247, 250)
    pdf.set_draw_color(210, 215, 225)
    for title, desc in rules:
        pdf.rect(12, pdf.get_y(), 186, 12, 'FD')
        pdf.set_xy(15, pdf.get_y() + 1.5)
        pdf.set_font('Helvetica', 'B', 8)
        pdf.set_text_color(30, 64, 175)
        pdf.cell(45, 4.5, title + ':', new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(50, 55, 65)
        pdf.multi_cell(135, 4.5, desc)
        pdf.ln(2.5)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)
    print(f'PDF generated successfully at: {output_path}')

if __name__ == '__main__':
    create_pdf('/Users/user/DNA360 APP/public/DNA_360_Access_Credentials_and_Roles.pdf')
    create_pdf('/Users/user/DNA360 APP/DNA_360_Access_Credentials_and_Roles.pdf')
