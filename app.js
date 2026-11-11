import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Public publishable key only. Never put a service_role/secret key in browser code.
const SUPABASE_URL = 'https://lpeayukkjrjdffqffzgo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PRiYUUiYuamROLWGM70ryw_mR0dR5O9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const products={soap:{name:'صابونية الأعشاب',en:'Herbal Soap',price:3.5},glycerin:{name:'حمام الجلسرين',en:'Glycerin Bath',price:4}};
let cart={},lang='ar',authMode='signup',currentUser=null;
const $=s=>document.querySelector(s), money=n=>n.toFixed(3)+' ر.ع';
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3000)}
function render(){let count=Object.values(cart).reduce((a,b)=>a+b,0);$('#cartCount').textContent=count;let total=0,html='';for(let [id,q] of Object.entries(cart)){let p=products[id];total+=p.price*q;html+=`<div class="cart-line"><div>${lang==='ar'?p.name:p.en}<small>${money(p.price)} · ${q} ×</small></div><div class="qty"><button data-id="${id}" data-delta="-1">−</button><b>${q}</b><button data-id="${id}" data-delta="1">＋</button></div></div>`}$('#cartItems').innerHTML=html||`<p class="empty">${lang==='ar'?'سلتكِ فارغة حالياً.':'Your cart is empty.'}</p>`;$('#subtotal').textContent=money(total)}
document.querySelectorAll('.add').forEach(b=>b.addEventListener('click',()=>{let id=b.dataset.product;cart[id]=(cart[id]||0)+1;render();toast(lang==='ar'?'أُضيف المنتج إلى السلة':'Added to cart')}));
$('#cartItems').addEventListener('click',e=>{let b=e.target.closest('button[data-id]');if(!b)return;let id=b.dataset.id;cart[id]+=Number(b.dataset.delta);if(cart[id]<=0)delete cart[id];render()});
function openCart(){$('#drawer').classList.add('show');$('#overlay').classList.add('show')}function closeCart(){$('#drawer').classList.remove('show');$('#overlay').classList.remove('show')}
$('#cartOpen').onclick=openCart;$('#cartClose').onclick=closeCart;$('#overlay').onclick=closeCart;
function openAuth(){closeCart();$('#authModal').classList.add('show');$('#overlay').classList.add('show');$('#authSignout').hidden=!currentUser;$('#authForm').hidden=!!currentUser;$('#authSwitch').hidden=!!currentUser;$('#authTitle').textContent=currentUser?'أهلاً بك في نورينا':'حساب نورينا';$('#authMessage').textContent=currentUser?`تم تسجيل الدخول بالبريد: ${currentUser.email}`:'سجّلي الدخول أو أنشئي حساباً جديداً للمتابعة.'}
function closeAuth(){$('#authModal').classList.remove('show');$('#overlay').classList.remove('show')}
$('#accountOpen').onclick=openAuth;$('#authClose').onclick=closeAuth;
function setMode(mode){authMode=mode;const signup=mode==='signup';$('#registerFields').hidden=!signup;$('#authTitle').textContent=signup?'إنشاء حساب جديد':'تسجيل الدخول';$('#authSubmit').textContent=signup?'إنشاء حساب':'دخول';$('#authSwitch').textContent=signup?'لديك حساب؟ تسجيل الدخول':'مستخدم جديد؟ إنشاء حساب';$('#authPassword').autocomplete=signup?'new-password':'current-password';}
$('#authSwitch').onclick=()=>setMode(authMode==='signup'?'login':'signup');
$('#authForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('#authEmail').value.trim(),password=$('#authPassword').value;const button=$('#authSubmit');button.disabled=true;button.textContent='جارٍ المعالجة…';try{if(authMode==='signup'){const username=$('#authUsername').value.trim(),phone=$('#authPhone').value.trim();if(username.length<3||!phone)throw new Error('أدخلي اسم المستخدم ورقم الهاتف.');const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username,phone,marketing_whatsapp:$('#authMarketing').checked}}});if(error)throw error;if(data.session){currentUser=data.user;toast('تم إنشاء الحساب وتسجيل الدخول بنجاح.');openAuth()}else{toast('تم إنشاء الحساب. إذا طُلب تأكيد البريد، أكملي التعليمات الواردة إليكِ.');setMode('login')}}else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;currentUser=data.user;toast('تم تسجيل الدخول بنجاح.');openAuth()}}catch(err){toast(err.message||'تعذر إكمال العملية. حاولي مرة أخرى.')}finally{button.disabled=false;button.textContent=authMode==='signup'?'إنشاء حساب':'دخول'}});
$('#authSignout').onclick=async()=>{const {error}=await supabase.auth.signOut();if(error){toast(error.message);return}currentUser=null;closeAuth();toast('تم تسجيل الخروج.')};
supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;$('#accountOpen').textContent=currentUser?'حسابي ✓':'حسابي'});
const {data:{session}}=await supabase.auth.getSession();currentUser=session?.user||null;if(currentUser)$('#accountOpen').textContent='حسابي ✓';
function openCheckout(){closeCart();$('#checkoutModal').classList.add('show');$('#overlay').classList.add('show');const meta=currentUser?.user_metadata||{};$('#orderName').value=meta.username||'';$('#orderPhone').value=meta.phone||'';}
function closeCheckout(){$('#checkoutModal').classList.remove('show');$('#overlay').classList.remove('show')}
$('#checkout').onclick=()=>{if(!Object.keys(cart).length){toast('أضيفي منتجاً أولاً');return}if(!currentUser){toast('سجّلي الدخول أولاً لمتابعة الطلب.');openAuth();return}openCheckout()};
$('#checkoutClose').onclick=closeCheckout;
$('#checkoutForm').addEventListener('submit',async e=>{e.preventDefault();if(!currentUser){closeCheckout();openAuth();return}
 const button=$('#placeOrder');button.disabled=true;button.textContent='جارٍ حفظ الطلب…';
 const items=Object.entries(cart).map(([product_id,quantity])=>({product_id,quantity}));
const popup=null;
 try{
  const {data,error}=await supabase.rpc('create_norina_order',{p_items:items,p_customer_name:$('#orderName').value.trim(),p_customer_phone:$('#orderPhone').value.trim(),p_delivery_address:$('#orderAddress').value.trim(),p_customer_note:$('#orderNote').value.trim()||null});
  if(error)throw error;
  const order=data?.[0];if(!order?.order_number)throw new Error('لم نتلقَّ رقم الطلب من النظام.')
   ;alert('تم حفظ طلبك بنجاح. رقم الطلب: '+order.order_number);
  const message=`مرحباً نورينا، أرسلت طلباً مبدئياً رقم ${order.order_number}. قيمة المنتجات: ${Number(order.subtotal_omr).toFixed(3)} ر.ع. أرجو التواصل معي لتحديد رسوم توصيل Yango والإجمالي النهائي. الاسم: ${$('#orderName').value.trim()}، الهاتف: ${$('#orderPhone').value.trim()}، العنوان: ${$('#orderAddress').value.trim()}`;
  const waUrl='https://wa.me/96892018802?text='+encodeURIComponent(message);
  cart={};render();closeCheckout();toast(`تم حفظ الطلب ${order.order_number}. سنتواصل معك لتحديد رسوم التوصيل.`);
window.location.href=waUrl;
 }catch(err){if(popup)popup.close();toast(err.message||'تعذر حفظ الطلب. حاولي مرة أخرى.');}
 finally{button.disabled=false;button.textContent='إرسال طلب مبدئي'}
});
$('#guideOpen').onclick=()=>$('#guideModal').classList.add('show');$('#guideClose').onclick=()=>$('#guideModal').classList.remove('show');
$('#langBtn').onclick=()=>{lang=lang==='ar'?'en':'ar';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('#langBtn').textContent=lang==='ar'?'EN':'عربي';document.querySelectorAll('[data-ar]').forEach(el=>el.textContent=el.dataset[lang]);render()};
