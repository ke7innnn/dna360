import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class PDFReport(FPDF):
    def header(self):
        # Top banner background (Dark luxury charcoal/slate)
        self.set_fill_color(13, 17, 23)
        self.rect(0, 0, 210, 32, 'F')
        
        # Top accent line (Electric Cyan #00c8c8)
        self.set_fill_color(0, 200, 200)
        self.rect(0, 0, 210, 3, 'F')
        
        # Brand title
        self.set_font('Helvetica', 'B', 15)
        self.set_text_color(255, 255, 255)
        self.set_xy(14, 8)
        self.cell(0, 8, 'DNA 360 FITNESS  |  OFFICIAL SYSTEM CREDENTIALS DIRECTORY', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Subtitle
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(160, 165, 180)
        self.set_xy(14, 18)
        self.cell(140, 6, 'Powai Flagship - Production Hardened RBAC & Management Accounts Directory', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(0, 200, 200)
        self.set_xy(150, 18)
        self.cell(46, 6, 'CONFIDENTIAL', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_draw_color(220, 225, 235)
        self.line(14, self.get_y(), 196, self.get_y())
        self.set_font('Helvetica', '', 8)
        self.set_text_color(130, 135, 145)
        self.set_y(-12)
        self.cell(0, 6, f'DNA 360 Fitness Centre - Confidential Internal Document - Page {self.page_no()}', align='C')

def create_pdf(output_paths):
    pdf = PDFReport(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(auto=True, margin=14)
    pdf.add_page()
    
    # ─── SECTION 1: GLOBAL ACCESS OVERVIEW ───
    pdf.set_y(35)
    pdf.set_fill_color(240, 249, 250)
    pdf.set_draw_color(0, 180, 180)
    pdf.rect(14, pdf.get_y(), 182, 27, 'FD')
    
    pdf.set_xy(18, pdf.get_y() + 2.5)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(0, 130, 130)
    pdf.cell(0, 5.5, 'Production Login Information & Security Protocol', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(35, 40, 50)
    pdf.set_x(18)
    pdf.cell(85, 4.5, '* Web Application URL: https://www.dna360.in/login', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(85, 4.5, '* Password Model: Unique Temporary Credentials', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.cell(85, 4.5, '* Authentication Engine: Supabase Cloud Auth + Edge RBAC', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(85, 4.5, '* First-Login Policy: Mandatory Password Reset Enforced', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_x(18)
    pdf.cell(85, 4.5, '* Lockout Policy: 5 Failed Attempts -> 15-Min Account Lock', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(85, 4.5, '* Location: 502, Knowledge Park, Powai, Mumbai', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(5)
    
    # ─── SECTION 2: EXECUTIVE & REVENUE LEADERSHIP ───
    pdf.set_font('Helvetica', 'B', 10.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, '1. Executive Administration & Revenue Leadership', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 7.5)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 3.5, 'Full system administrative capabilities, financial reporting, and user privilege controls.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    headers = ['Name', 'Role', 'Login Email', 'Temp Password', 'Access Scope']
    widths = [36, 30, 48, 30, 38]
    
    def render_table(header_list, width_list, data_rows):
        pdf.set_fill_color(24, 32, 47)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Helvetica', 'B', 7.5)
        for i, h in enumerate(header_list):
            pdf.cell(width_list[i], 6, h, border=1, align='C', fill=True)
        pdf.ln()
        
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(20, 25, 35)
        for row_idx, row in enumerate(data_rows):
            fill = row_idx % 2 == 1
            pdf.set_fill_color(246, 248, 251) if fill else pdf.set_fill_color(255, 255, 255)
            for i, val in enumerate(row):
                align = 'C' if i in [1, 3] else 'L'
                pdf.cell(width_list[i], 5.5, val, border=1, align=align, fill=fill)
            pdf.ln()
    
    exec_data = [
        ['Executive Admin', 'Owner / Executive', 'admin@dna360.in', 'Dna#Admin92!kP', 'All Features, Full Revenue'],
        ['Keith Shah', 'Administrator', 'keith.mktg@dna360.in', 'Dna#Keith84!xM', 'Full Admin Access (All Features)'],
        ['Swapnil Borhade', 'HR Head', 'swapnil.hr@dna360.in', 'Dna#Swap71@hR', 'HR, Staff Rosters, Attendance'],
        ['Monica Picholla', 'Asst. Sales Head', 'monica.sales@dna360.in', 'Dna#Moni55$sL', 'Memberships, Sales, Invoicing'],
    ]
    render_table(headers, widths, exec_data)
    pdf.ln(3)
    
    # ─── SECTION 3: FRONT DESK & OPERATIONS ───
    pdf.set_font('Helvetica', 'B', 10.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, '2. Front Desk & Operations (Check-in, Leads, Sales)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 7.5)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 3.5, 'Front desk QR turnstile check-in scanning, inquiry management, and sales floor enrollments.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    ops_data = [
        ['Front Desk Operations', 'Front Desk', 'frontdesk@dna360.in', 'Dna#Desk42!fD', 'Check-in Desk, QR Scanner'],
        ['Surendra Chaudhary', 'Consultant', 'surendra.fc@dna360.in', 'Dna#Sure63^fC', 'Sales Leads & Enrollments'],
        ['Krish Rawat', 'Consultant', 'krish.fc@dna360.in', 'Dna#Kris89*fC', 'Sales Leads & Enrollments'],
        ['Pallavi More', 'Consultant', 'pallavi.fc@dna360.in', 'Dna#Pall37%fC', 'Sales Leads & Enrollments'],
        ['Nisha Jadhav', 'Consultant', 'nisha.fc@dna360.in', 'Dna#Nish76#fC', 'Sales Leads & Enrollments'],
        ['Suresh Patil', 'Supervisor', 'suresh.sup@dna360.in', 'Dna#Sure28&sU', 'Floor Access & Attendance'],
    ]
    render_table(headers, widths, ops_data)
    pdf.ln(3)

    # ─── SECTION 4: COACHES & TRAINERS ───
    pdf.set_font('Helvetica', 'B', 10.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, '3. Coaching & Training Department (Sessions & Studios)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 7.5)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 3.5, 'Trainer timetable, class schedules, and personal training client workout programming.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    trainer_data = [
        ['Rajesh Poojary', 'Head Trainer', 'rajesh.coach@dna360.in', 'Dna#Raje91!hT', 'Studio Schedule & Trainers'],
        ['Aftab Memon', 'Head Trainer', 'aftab.coach@dna360.in', 'Dna#Afta47@hT', 'Studio Schedule & Trainers'],
        ['Pramod Sawant', 'General Trainer', 'pramod.trainer@dna360.in', 'Dna#Pram62$gT', 'Assigned PT Clients & Logs'],
        ['Jateen Kadam', 'General Trainer', 'jateen.trainer@dna360.in', 'Dna#Jate83%gT', 'Assigned PT Clients & Logs'],
        ['Aditya Shinde', 'General Trainer', 'aditya.trainer@dna360.in', 'Dna#Adit51^gT', 'Assigned PT Clients & Logs'],
        ['Vaibhav Pawar', 'General Trainer', 'vaibhav.trainer@dna360.in', 'Dna#Vaib94*gT', 'Assigned PT Clients & Logs'],
        ['Hussain Shaikh', 'General Trainer', 'hussain.trainer@dna360.in', 'Dna#Huss36#gT', 'Assigned PT Clients & Logs'],
        ['Liladhar Gaikwad', 'Masseur', 'liladhar.masseur@dna360.in', 'Dna#Lila75!mS', 'Spa & Therapy Appointments'],
    ]
    render_table(headers, widths, trainer_data)
    pdf.ln(3)

    # Security Guidelines
    pdf.set_fill_color(248, 249, 251)
    pdf.set_draw_color(210, 215, 225)
    pdf.rect(14, pdf.get_y(), 182, 22, 'FD')
    pdf.set_xy(17, pdf.get_y() + 1.5)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(20, 30, 50)
    pdf.cell(0, 4, 'Security & Account Best Practices:', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font('Helvetica', '', 7)
    pdf.set_text_color(70, 75, 85)
    pdf.set_x(17)
    pdf.cell(0, 3.5, '1. Mandatory First Login Reset: All staff must change their temporary password upon first login.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(17)
    pdf.cell(0, 3.5, '2. Password Complexity: Min 10 chars, >=1 uppercase, >=1 lowercase, >=1 numeric digit, >=1 special character.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(17)
    pdf.cell(0, 3.5, '3. Account Lockout: 5 consecutive failed login attempts trigger an automatic 15-minute lockout.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(17)
    pdf.cell(0, 3.5, '4. Turnstile Security: Optical dynamic QR tokens expire after 90 seconds with replay attack prevention.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    for p in output_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        pdf.output(p)
        print(f'PDF generated successfully: {p}')

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    paths = [
        os.path.join(base_dir, 'DNA_360_Access_Credentials.pdf'),
        os.path.join(base_dir, 'public', 'DNA_360_Access_Credentials.pdf'),
    ]
    create_pdf(paths)
