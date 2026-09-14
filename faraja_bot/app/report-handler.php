<?php
declare(strict_types=1);
function jsonResponse(array $payload,int $status=200):void{http_response_code($status);header('Content-Type: application/json; charset=utf-8');echo json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function clean($v){ if(is_string($v)){ $v=trim($v); return $v===''?null:$v; } return $v; }
function normalize(array $in):array{
  $category=clean($in['category']??null); if(!$category) throw new InvalidArgumentException('موضوع گزارش مشخص نشده است.');
  $allowed=['فرد','ملک','شیء','پدیده اجتماعی','نهاد و سازمان']; if(!in_array($category,$allowed,true)) throw new InvalidArgumentException('موضوع گزارش نامعتبر است.');
  $form=is_array($in['form']??null)?$in['form']:[];
  // مقدار قدیمی یا ارسالیِ دستی را ذخیره نکن.
  unset($form['priority']);
  if(count(array_filter($form,fn($v)=>is_scalar($v)&&trim((string)$v)!==''))===0) throw new InvalidArgumentException('اطلاعات گزارش وارد نشده است.');
  $r=['reportType'=>'گزارش','category'=>$category,'subtype'=>clean($in['subtype']??null),'form'=>$form,'location'=>is_array($in['location']??null)?$in['location']:[],'time'=>is_array($in['time']??null)?$in['time']:[]];
  if(isset($in['documents'])&&is_array($in['documents'])) {
    $docs=[];
    foreach(array_slice($in['documents'],0,10) as $doc){
      if(!is_array($doc)) continue;
      $mime=(string)($doc['mime']??'');
      if(str_starts_with($mime,'image/')) $docs[]=$doc;
    }
    $r['documents']=$docs;
  }
  return $r;
}
function handleReportRequest():void{if($_SERVER['REQUEST_METHOD']!=='POST')return;$data=json_decode(file_get_contents('php://input')?:'',true);if(!is_array($data))jsonResponse(['ok'=>false,'message'=>'اطلاعات ارسالی نامعتبر است'],400);try{$report=normalize($data);}catch(Throwable $e){jsonResponse(['ok'=>false,'message'=>$e->getMessage()],422);} $report['id']=bin2hex(random_bytes(8));$report['created_at']=date('c');$file=__DIR__.'/../data/reports.json';$reports=[];if(is_file($file)){$old=json_decode(file_get_contents($file)?:'',true);if(is_array($old))$reports=$old;}$reports[]=$report;$json=json_encode($reports,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);if($json===false||file_put_contents($file,$json,LOCK_EX)===false)jsonResponse(['ok'=>false,'message'=>'ذخیره گزارش انجام نشد'],500);jsonResponse(['ok'=>true,'message'=>'گزارش با موفقیت ثبت شد','report'=>$report]);}
