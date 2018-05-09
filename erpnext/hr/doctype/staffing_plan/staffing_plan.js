// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Staffing Plan', {
	setup: function(frm) {
		frm.set_query("designation", "staffing_details", function() {
			let designations = [];
			$.each(frm.doc.staffing_details, function(index, staff_detail) {
				if(staff_detail.designation){
					designations.push(staff_detail.designation)
				}
			})
			// Filter out designations already selected in Staffing Plan Detail
			return {
				filters: [
					['Designation', 'name', 'not in', designations],
				]
			}
		});
	}
});

frappe.ui.form.on('Staffing Plan Detail', {
	designation: function(frm, cdt, cdn) {
		let child = locals[cdt][cdn]
		if(frm.doc.company && child.designation){
			frappe.call({
				"method": "erpnext.hr.doctype.staffing_plan.staffing_plan.get_current_employee_count",
				args: {
					designation: child.designation,
					company: frm.doc.company
				},
				callback: function (data) {
					if(data.message){
						frappe.model.set_value(cdt, cdn, 'current_count', data.message);
					}
					else{ // No employees for this designation
						frappe.model.set_value(cdt, cdn, 'current_count', 0);
					}
				}
			});
		}
	},

	number_of_positions: function(frm, cdt, cdn) {
		set_vacancies(frm, cdt, cdn);
	},

	current_count: function(frm, cdt, cdn) {
		set_vacancies(frm, cdt, cdn);
	},

	estimated_cost_per_position: function(frm, cdt, cdn) {
		let child = locals[cdt][cdn];
		set_total_estimated_cost(frm, cdt, cdn);
	}

});

var set_vacancies = function(frm, cdt, cdn) {
	let child = locals[cdt][cdn]
	if(child.number_of_positions) {
		frappe.model.set_value(cdt, cdn, 'vacancies', child.number_of_positions - child.current_count);
	}
	else{
		frappe.model.set_value(cdt, cdn, 'vacancies', 0);
	}
	set_total_estimated_cost(frm, cdt, cdn);
}

// Note: Estimated Cost is calculated on number of Vacancies
var set_total_estimated_cost = function(frm, cdt, cdn) {
	let child = locals[cdt][cdn]
	if(child.number_of_positions && child.estimated_cost_per_position) {
		frappe.model.set_value(cdt, cdn, 'total_estimated_cost', child.vacancies * child.estimated_cost_per_position);
	}
	else {
		frappe.model.set_value(cdt, cdn, 'total_estimated_cost', 0);
	}
	set_total_estimated_budget(frm);
};

var set_total_estimated_budget = function(frm) {
	let estimated_budget = 0.0
	if(frm.doc.staffing_details) {
		$.each(frm.doc.staffing_details, function(index, staff_detail) {
			if(staff_detail.total_estimated_cost){
				estimated_budget += staff_detail.total_estimated_cost
			}
		})
		frm.set_value('total_estimated_budget', estimated_budget);
	}
}