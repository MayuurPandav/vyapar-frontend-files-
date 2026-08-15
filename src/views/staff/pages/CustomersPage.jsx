import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { Search, PlusCircle, User } from 'lucide-react';
import { useData } from '../context/DataContext';

const CustomersPage = () => {
	const navigate = useNavigate();
	const { customers, customerOutstanding, ready } = useData();
	const [search, setSearch] = useState('');

	if (!ready) return <Loader />;

	const filtered = customers.filter((customer) =>
		customer.name.toLowerCase().includes(search.toLowerCase()) ||
		(customer.email || '').toLowerCase().includes(search.toLowerCase()) ||
		(customer.phone || '').toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="space-y-6">
			<div className="card">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h2 className="text-2xl font-semibold">Customers</h2>
						<p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Manage your customer list and view contact details.</p>
					</div>
					<button onClick={() => navigate('/customers/new')} className="btn btn--primary">
						<PlusCircle className="h-4 w-4" /> Add Customer
					</button>
				</div>
			</div>

			<div className="card">
				<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h3 className="text-lg font-semibold">Customer Directory</h3>
					<div className="topbar__search" style={{ width: 'auto', minWidth: '220px' }}>
						<i className="fas fa-search" style={{ left: '16px' }}></i>
						<input
							type="search"
							placeholder="Search customers..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							style={{ paddingLeft: '44px' }}
						/>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="tbl">
						<thead>
							<tr>
								<th>Name</th>
								<th>Email</th>
								<th>Phone</th>
								<th>Outstanding Balance</th>
								<th>Address</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((customer) => (
								<tr key={customer._id} onClick={() => navigate(`/customers/${customer._id}`)} style={{ cursor: 'pointer' }}>
									<td style={{ fontWeight: '500', color: 'var(--text-1)' }}>
										<div className="flex items-center gap-2">
											<User className="h-4 w-4" style={{ color: 'var(--text-3)' }} />
											<span>{customer.name}</span>
										</div>
									</td>
									<td>{customer.email || '-'}</td>
									<td>{customer.phone || '-'}</td>
									<td style={{ fontWeight: '600', color: 'var(--red)' }}>
										₹{(customer.outstandingBalance ?? customerOutstanding?.[customer._id] ?? 0).toLocaleString()}
									</td>
									<td style={{ color: 'var(--text-2)' }}>{customer.address || '-'}</td>
								</tr>
							))}
						</tbody>
					</table>
					{filtered.length === 0 && <p className="mt-5 text-sm" style={{ color: 'var(--text-3)' }}>No customers found.</p>}
				</div>
			</div>
		</div>
	);
};

export default CustomersPage;
